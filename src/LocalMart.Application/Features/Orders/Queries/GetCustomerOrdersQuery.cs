using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.Features.Orders.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.Orders.Queries;

public record GetCustomerOrdersQuery(Guid CustomerId) : IRequest<List<OrderDto>>;

public class GetCustomerOrdersQueryHandler : IRequestHandler<GetCustomerOrdersQuery, List<OrderDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCustomerOrdersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<OrderDto>> Handle(GetCustomerOrdersQuery request, CancellationToken cancellationToken)
    {
        var orders = await _context.Orders
            .Include(o => o.ShippingAddress)
            .Include(o => o.Payment)
            .Include(o => o.VendorOrders)
                .ThenInclude(vo => vo.Vendor)
            .Include(o => o.VendorOrders)
                .ThenInclude(vo => vo.Items)
            .Where(o => o.CustomerId == request.CustomerId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        return orders.Select(MapToOrderDto).ToList();
    }

    private static OrderDto MapToOrderDto(Domain.Entities.Order order)
    {
        CustomerAddressDto? addressDto = order.ShippingAddress != null
            ? new CustomerAddressDto(
                Id: order.ShippingAddress.Id,
                Title: order.ShippingAddress.Title,
                AddressLine1: order.ShippingAddress.AddressLine1,
                AddressLine2: order.ShippingAddress.AddressLine2,
                City: order.ShippingAddress.City,
                State: order.ShippingAddress.State,
                PostalCode: order.ShippingAddress.PostalCode
            )
            : null;

        var vendorOrderDtos = order.VendorOrders.Select(vo => new VendorOrderDto(
            Id: vo.Id,
            ParentOrderId: vo.ParentOrderId,
            VendorId: vo.VendorId,
            VendorStoreName: vo.Vendor?.StoreName ?? string.Empty,
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
        )).ToList();

        PaymentDto? paymentDto = order.Payment != null
            ? new PaymentDto(
                Id: order.Payment.Id,
                OrderId: order.Payment.OrderId,
                Amount: order.Payment.Amount,
                PaymentMethod: order.Payment.PaymentMethod.ToString(),
                PaymentStatus: order.Payment.PaymentStatus.ToString(),
                GatewayTransactionId: order.Payment.GatewayTransactionId
            )
            : null;

        return new OrderDto(
            Id: order.Id,
            CustomerId: order.CustomerId,
            OrderNumber: order.OrderNumber,
            ShippingAddressId: order.ShippingAddressId,
            ShippingAddress: addressDto,
            SubTotal: order.SubTotal,
            DiscountAmount: order.DiscountAmount,
            DeliveryFee: order.DeliveryFee,
            GrandTotal: order.GrandTotal,
            PaymentStatus: order.PaymentStatus.ToString(),
            PaymentMethod: order.PaymentMethod.ToString(),
            CreatedAt: order.CreatedAt,
            VendorOrders: vendorOrderDtos,
            Payment: paymentDto
        );
    }
}
