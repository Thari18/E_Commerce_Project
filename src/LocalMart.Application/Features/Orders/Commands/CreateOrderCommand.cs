using System.Security.Cryptography;
using System.Text;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.Common.Models;
using LocalMart.Application.Features.Orders.DTOs;
using LocalMart.Domain.Entities;
using LocalMart.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

using DomainOrder = LocalMart.Domain.Entities.Order;
using DomainVendorOrder = LocalMart.Domain.Entities.VendorOrder;
using DomainOrderItem = LocalMart.Domain.Entities.OrderItem;
using DomainPayment = LocalMart.Domain.Entities.Payment;

namespace LocalMart.Application.Features.Orders.Commands;

public record CreateOrderCommand(
    Guid CustomerId,
    Guid ShippingAddressId,
    string PaymentMethod,
    string? CouponCode,
    string IdempotencyKey
) : IRequest<OrderDto>;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly MarketplaceOptions _marketplaceOptions;
    private static readonly SemaphoreSlim _idempotencyLock = new(1, 1);

    private record IdempotencyEntry(string RequestHash, OrderDto? ResponseDto, bool IsCompleted);

    public CreateOrderCommandHandler(
        IApplicationDbContext context,
        IMemoryCache cache,
        IOptions<MarketplaceOptions> marketplaceOptions)
    {
        _context = context;
        _cache = cache;
        _marketplaceOptions = marketplaceOptions.Value;
    }

    public async Task<OrderDto> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.IdempotencyKey))
        {
            throw new ArgumentException("Idempotency-Key header is required for order creation.");
        }

        // Parse PaymentMethod enum
        if (!Enum.TryParse<PaymentMethod>(request.PaymentMethod, true, out var paymentMethodEnum))
        {
            throw new ArgumentException($"Invalid payment method '{request.PaymentMethod}'. Supported values are COD, Online.");
        }

        var requestHash = ComputeRequestHash(request);
        var cacheKey = $"idempotency_order_{request.IdempotencyKey}";

        // 1. Idempotency Check & Reservation
        await _idempotencyLock.WaitAsync(cancellationToken);
        try
        {
            if (_cache.TryGetValue(cacheKey, out IdempotencyEntry? existingEntry) && existingEntry != null)
            {
                if (!existingEntry.IsCompleted)
                {
                    throw new InvalidOperationException("An order creation request with this Idempotency-Key is currently being processed.");
                }

                if (existingEntry.RequestHash != requestHash)
                {
                    throw new InvalidOperationException("Idempotency key collision: a different request payload was submitted using the same Idempotency-Key.");
                }

                if (existingEntry.ResponseDto != null)
                {
                    return existingEntry.ResponseDto;
                }
            }

            // Reserve key in cache (in progress)
            var inProgressEntry = new IdempotencyEntry(requestHash, null, IsCompleted: false);
            _cache.Set(cacheKey, inProgressEntry, TimeSpan.FromHours(24));
        }
        finally
        {
            _idempotencyLock.Release();
        }

        // 2. Validate Shipping Address
        var address = await _context.CustomerAddresses
            .FirstOrDefaultAsync(a => a.Id == request.ShippingAddressId && a.CustomerId == request.CustomerId, cancellationToken);

        if (address == null)
        {
            RemoveIdempotencyKey(cacheKey);
            throw new InvalidOperationException("Shipping address was not found or does not belong to the authenticated customer.");
        }

        // 3. Fetch Customer Cart
        var cart = await _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Vendor)
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Inventory)
            .FirstOrDefaultAsync(c => c.CustomerId == request.CustomerId, cancellationToken);

        if (cart == null || !cart.Items.Any())
        {
            RemoveIdempotencyKey(cacheKey);
            throw new InvalidOperationException("Cart is empty. Order cannot be placed.");
        }

        // 4. Validate Products & Inventories (Re-read authoritative Product prices)
        foreach (var item in cart.Items)
        {
            var product = item.Product;
            if (product == null || product.Status != ProductStatus.Active)
            {
                RemoveIdempotencyKey(cacheKey);
                throw new InvalidOperationException($"Product '{product?.Name ?? item.ProductId.ToString()}' is inactive or no longer available.");
            }

            if (product.Vendor == null || product.Vendor.Status != "Approved")
            {
                RemoveIdempotencyKey(cacheKey);
                throw new InvalidOperationException($"Vendor for product '{product.Name}' is not active or approved.");
            }

            var inventory = product.Inventory;
            if (inventory == null || inventory.QuantityAvailable < item.Quantity)
            {
                RemoveIdempotencyKey(cacheKey);
                throw new InvalidOperationException($"Insufficient stock for product '{product.Name}'. Available: {inventory?.QuantityAvailable ?? 0}, requested: {item.Quantity}.");
            }
        }

        // 5. Calculate Totals & Coupon Discount
        decimal subTotal = cart.Items.Sum(i => i.Product.Price * i.Quantity);
        decimal discountAmount = 0m;

        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code == request.CouponCode && c.IsActive, cancellationToken);

            var now = DateTime.UtcNow;
            if (coupon == null || coupon.StartDate > now || coupon.EndDate < now)
            {
                RemoveIdempotencyKey(cacheKey);
                throw new InvalidOperationException($"Coupon code '{request.CouponCode}' is invalid or expired.");
            }
            if (subTotal < coupon.MinOrderAmount)
            {
                RemoveIdempotencyKey(cacheKey);
                throw new InvalidOperationException($"Coupon code '{request.CouponCode}' requires a minimum order subtotal of {coupon.MinOrderAmount:C}.");
            }

            if (coupon.DiscountType.Equals("Percentage", StringComparison.OrdinalIgnoreCase))
            {
                discountAmount = subTotal * (coupon.DiscountValue / 100m);
                if (coupon.MaxDiscountAmount.HasValue && discountAmount > coupon.MaxDiscountAmount.Value)
                {
                    discountAmount = coupon.MaxDiscountAmount.Value;
                }
            }
            else if (coupon.DiscountType.Equals("Fixed", StringComparison.OrdinalIgnoreCase))
            {
                discountAmount = coupon.DiscountValue;
            }

            if (discountAmount > subTotal)
            {
                discountAmount = subTotal;
            }
        }

        decimal deliveryFee = subTotal > 0 ? _marketplaceOptions.FlatDeliveryFee : 0m;
        decimal grandTotal = Math.Max(0m, subTotal - discountAmount + deliveryFee);

        // 6. Begin Single Database Transaction
        IDbContextTransaction? transaction = null;
        if (_context is DbContext dbContext)
        {
            try
            {
                transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            }
            catch
            {
                // Non-relational/in-memory provider safely handled
            }
        }

        try
        {
            // A. Atomically Decrement Inventory
            foreach (var item in cart.Items)
            {
                var inventory = item.Product.Inventory!;
                if (inventory.QuantityAvailable < item.Quantity)
                {
                    throw new InvalidOperationException($"Insufficient stock for product '{item.Product.Name}'.");
                }
                inventory.QuantityAvailable -= item.Quantity;
            }

            // B. Create Parent Order
            var orderNumber = GenerateOrderNumber();
            var parentOrder = new DomainOrder
            {
                Id = Guid.NewGuid(),
                CustomerId = request.CustomerId,
                OrderNumber = orderNumber,
                ShippingAddressId = address.Id,
                SubTotal = subTotal,
                DiscountAmount = discountAmount,
                DeliveryFee = deliveryFee,
                GrandTotal = grandTotal,
                PaymentMethod = paymentMethodEnum,
                PaymentStatus = PaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            _context.Orders.Add(parentOrder);

            // C. Multi-Vendor Order Splitting & OrderItems
            var vendorGroups = cart.Items.GroupBy(i => i.Product.VendorId).ToList();
            int subOrderCounter = 1;

            foreach (var group in vendorGroups)
            {
                var vendor = group.First().Product.Vendor;
                decimal vendorSubTotal = group.Sum(i => i.Product.Price * i.Quantity);
                decimal commissionRate = vendor.CommissionRate; // Snapshot authoritative vendor commission rate
                decimal commissionAmount = Math.Round(vendorSubTotal * (commissionRate / 100m), 2);
                decimal netEarnings = vendorSubTotal - commissionAmount;

                var vendorOrder = new DomainVendorOrder
                {
                    Id = Guid.NewGuid(),
                    ParentOrderId = parentOrder.Id,
                    VendorId = vendor.Id,
                    SubOrderNumber = $"{orderNumber}-V{subOrderCounter++}",
                    SubTotal = vendorSubTotal,
                    CommissionRate = commissionRate,
                    CommissionAmount = commissionAmount,
                    NetEarnings = netEarnings,
                    Status = VendorOrderStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                };

                foreach (var item in group)
                {
                    var orderItem = new DomainOrderItem
                    {
                        Id = Guid.NewGuid(),
                        VendorOrderId = vendorOrder.Id,
                        ProductId = item.ProductId,
                        ProductName = item.Product.Name,
                        UnitPrice = item.Product.Price, // Authoritative price snapshot
                        Quantity = item.Quantity,
                        TotalPrice = item.Product.Price * item.Quantity,
                        CreatedAt = DateTime.UtcNow
                    };
                    vendorOrder.Items.Add(orderItem);
                }

                parentOrder.VendorOrders.Add(vendorOrder);
            }

            // D. Create Payment Entity
            var payment = new DomainPayment
            {
                Id = Guid.NewGuid(),
                OrderId = parentOrder.Id,
                Amount = grandTotal,
                PaymentMethod = paymentMethodEnum,
                PaymentStatus = PaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            _context.Payments.Add(payment);

            // Build vendor lookup before clearing cart items
            var vendorStoreNames = cart.Items
                .GroupBy(ci => ci.Product.VendorId)
                .ToDictionary(g => g.Key, g => g.First().Product.Vendor?.StoreName ?? string.Empty);

            // E. Clear Cart Items
            _context.CartItems.RemoveRange(cart.Items);

            // F. Save Changes
            await _context.SaveChangesAsync(cancellationToken);

            // G. Commit Transaction
            if (transaction != null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            // 7. Map to Output DTO
            var addressDto = new CustomerAddressDto(
                Id: address.Id,
                Title: address.Title,
                AddressLine1: address.AddressLine1,
                AddressLine2: address.AddressLine2,
                City: address.City,
                State: address.State,
                PostalCode: address.PostalCode
            );

            var vendorOrderDtos = parentOrder.VendorOrders.Select(vo =>
            {
                var storeName = vendorStoreNames.TryGetValue(vo.VendorId, out var sName) ? sName : (vo.Vendor?.StoreName ?? string.Empty);
                return new VendorOrderDto(
                    Id: vo.Id,
                    ParentOrderId: vo.ParentOrderId,
                    VendorId: vo.VendorId,
                    VendorStoreName: storeName,
                    SubOrderNumber: vo.SubOrderNumber,
                    SubTotal: vo.SubTotal,
                    CommissionRate: vo.CommissionRate,
                    CommissionAmount: vo.CommissionAmount,
                    NetEarnings: vo.NetEarnings,
                    Status: vo.Status.ToString(),
                    Items: vo.Items.Select(oi => new OrderItemDto(
                        Id: oi.Id,
                        VendorOrderId: oi.VendorOrderId,
                        ProductId: oi.ProductId,
                        ProductName: oi.ProductName,
                        UnitPrice: oi.UnitPrice,
                        Quantity: oi.Quantity,
                        TotalPrice: oi.TotalPrice
                    )).ToList()
                );
            }).ToList();

            var paymentDto = new PaymentDto(
                Id: payment.Id,
                OrderId: payment.OrderId,
                Amount: payment.Amount,
                PaymentMethod: payment.PaymentMethod.ToString(),
                PaymentStatus: payment.PaymentStatus.ToString(),
                GatewayTransactionId: payment.GatewayTransactionId
            );

            var resultDto = new OrderDto(
                Id: parentOrder.Id,
                CustomerId: parentOrder.CustomerId,
                OrderNumber: parentOrder.OrderNumber,
                ShippingAddressId: parentOrder.ShippingAddressId,
                ShippingAddress: addressDto,
                SubTotal: parentOrder.SubTotal,
                DiscountAmount: parentOrder.DiscountAmount,
                DeliveryFee: parentOrder.DeliveryFee,
                GrandTotal: parentOrder.GrandTotal,
                PaymentStatus: parentOrder.PaymentStatus.ToString(),
                PaymentMethod: parentOrder.PaymentMethod.ToString(),
                CreatedAt: parentOrder.CreatedAt,
                VendorOrders: vendorOrderDtos,
                Payment: paymentDto
            );

            // 8. Update Idempotency Cache with Completed OrderDto
            _cache.Set(cacheKey, new IdempotencyEntry(requestHash, resultDto, IsCompleted: true), TimeSpan.FromHours(24));

            return resultDto;
        }
        catch
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync(cancellationToken);
            }
            RemoveIdempotencyKey(cacheKey);
            throw;
        }
    }

    private void RemoveIdempotencyKey(string cacheKey)
    {
        _cache.Remove(cacheKey);
    }

    private static string ComputeRequestHash(CreateOrderCommand request)
    {
        var raw = $"{request.CustomerId}|{request.ShippingAddressId}|{request.PaymentMethod}|{request.CouponCode?.Trim()}";
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(bytes);
    }

    private static string GenerateOrderNumber()
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var random = Random.Shared.Next(1000, 9999);
        return $"ORD-{timestamp}-{random}";
    }
}
