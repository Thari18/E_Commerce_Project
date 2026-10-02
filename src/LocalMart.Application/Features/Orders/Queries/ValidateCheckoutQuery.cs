using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.Common.Models;
using LocalMart.Application.Features.Orders.DTOs;
using LocalMart.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LocalMart.Application.Features.Orders.Queries;

public record ValidateCheckoutQuery(
    Guid CustomerId,
    Guid ShippingAddressId,
    string? CouponCode = null
) : IRequest<CheckoutValidationResultDto>;

public class ValidateCheckoutQueryHandler : IRequestHandler<ValidateCheckoutQuery, CheckoutValidationResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly MarketplaceOptions _marketplaceOptions;

    public ValidateCheckoutQueryHandler(IApplicationDbContext context, IOptions<MarketplaceOptions> marketplaceOptions)
    {
        _context = context;
        _marketplaceOptions = marketplaceOptions.Value;
    }

    public async Task<CheckoutValidationResultDto> Handle(ValidateCheckoutQuery request, CancellationToken cancellationToken)
    {
        var errors = new List<string>();

        // 1. Validate Shipping Address
        var address = await _context.CustomerAddresses
            .FirstOrDefaultAsync(a => a.Id == request.ShippingAddressId && a.CustomerId == request.CustomerId, cancellationToken);

        if (address == null)
        {
            throw new InvalidOperationException("Shipping address was not found or does not belong to the authenticated customer.");
        }

        var addressDto = new CustomerAddressDto(
            Id: address.Id,
            Title: address.Title,
            AddressLine1: address.AddressLine1,
            AddressLine2: address.AddressLine2,
            City: address.City,
            State: address.State,
            PostalCode: address.PostalCode
        );

        // 2. Fetch Customer Cart
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
            throw new InvalidOperationException("Cart is empty. Order cannot be validated or placed.");
        }

        // 3. Process Cart Items with Authoritative Product Prices & Inventory Checks
        var itemValidations = new List<CheckoutItemValidationDto>();
        foreach (var item in cart.Items)
        {
            var product = item.Product;
            if (product == null)
            {
                errors.Add($"Product with ID '{item.ProductId}' no longer exists.");
                continue;
            }

            var vendor = product.Vendor;
            var inventory = product.Inventory;
            var availableQty = inventory?.QuantityAvailable ?? 0;

            bool isProductActive = product.Status == ProductStatus.Active;
            bool isVendorApproved = vendor != null && vendor.Status == "Approved";
            bool hasStock = availableQty >= item.Quantity;

            bool isAvailable = isProductActive && isVendorApproved && hasStock;

            if (!isProductActive)
            {
                errors.Add($"Product '{product.Name}' is currently inactive.");
            }
            if (!isVendorApproved)
            {
                errors.Add($"Vendor for product '{product.Name}' is not active or approved.");
            }
            if (!hasStock)
            {
                errors.Add($"Insufficient stock for '{product.Name}'. Available: {availableQty}, requested: {item.Quantity}.");
            }

            itemValidations.Add(new CheckoutItemValidationDto(
                ProductId: product.Id,
                ProductName: product.Name,
                SKU: product.SKU,
                UnitPrice: product.Price, // Authoritative price from Product table
                Quantity: item.Quantity,
                TotalPrice: product.Price * item.Quantity,
                QuantityAvailable: availableQty,
                IsAvailable: isAvailable
            ));
        }

        // 4. Group by Vendor
        var vendorGroups = cart.Items
            .GroupBy(i => i.Product.VendorId)
            .Select(g =>
            {
                var vendor = g.First().Product.Vendor;
                var groupItems = itemValidations.Where(iv => g.Any(gi => gi.ProductId == iv.ProductId)).ToList();
                var groupSubTotal = groupItems.Sum(x => x.TotalPrice);

                return new VendorGroupedCheckoutDto(
                    VendorId: vendor.Id,
                    VendorStoreName: vendor.StoreName,
                    CommissionRate: vendor.CommissionRate,
                    SubTotal: groupSubTotal,
                    Items: groupItems
                );
            })
            .ToList();

        // 5. Calculate Subtotal
        decimal subTotal = itemValidations.Sum(i => i.TotalPrice);

        // 6. Calculate Coupon Discount if applicable
        decimal discountAmount = 0m;
        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code == request.CouponCode && c.IsActive, cancellationToken);

            var now = DateTime.UtcNow;
            if (coupon == null || coupon.StartDate > now || coupon.EndDate < now)
            {
                errors.Add($"Coupon code '{request.CouponCode}' is invalid or expired.");
            }
            else if (subTotal < coupon.MinOrderAmount)
            {
                errors.Add($"Coupon code '{request.CouponCode}' requires a minimum order amount of {coupon.MinOrderAmount:C}.");
            }
            else
            {
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
        }

        // 7. Calculate Delivery Fee & Grand Total
        decimal deliveryFee = subTotal > 0 ? _marketplaceOptions.FlatDeliveryFee : 0m;
        decimal grandTotal = Math.Max(0m, subTotal - discountAmount + deliveryFee);

        bool isValid = !errors.Any();

        return new CheckoutValidationResultDto(
            IsValid: isValid,
            Errors: errors,
            CartId: cart.Id,
            ShippingAddressId: address.Id,
            ShippingAddress: addressDto,
            SubTotal: subTotal,
            DiscountAmount: discountAmount,
            DeliveryFee: deliveryFee,
            GrandTotal: grandTotal,
            CouponCode: request.CouponCode,
            VendorGroups: vendorGroups
        );
    }
}
