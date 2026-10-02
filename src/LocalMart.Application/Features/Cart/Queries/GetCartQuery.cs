using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.Common.Models;
using LocalMart.Application.Features.Cart.DTOs;
using LocalMart.Domain.Entities;
using LocalMart.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LocalMart.Application.Features.Cart.Queries;

public record GetCartQuery(Guid CustomerId) : IRequest<CartDto>;

public class GetCartQueryHandler : IRequestHandler<GetCartQuery, CartDto>
{
    private readonly IApplicationDbContext _context;
    private readonly MarketplaceOptions _marketplaceOptions;

    public GetCartQueryHandler(IApplicationDbContext context, IOptions<MarketplaceOptions> marketplaceOptions)
    {
        _context = context;
        _marketplaceOptions = marketplaceOptions.Value;
    }

    public async Task<CartDto> Handle(GetCartQuery request, CancellationToken cancellationToken)
    {
        var cart = await _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Vendor)
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Images)
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Inventory)
            .FirstOrDefaultAsync(c => c.CustomerId == request.CustomerId, cancellationToken);

        if (cart == null)
        {
            return new CartDto(
                Id: Guid.Empty,
                CustomerId: request.CustomerId,
                VendorGroups: new List<VendorGroupedCartDto>(),
                TotalItems: 0,
                SubTotal: 0m,
                EstimatedDeliveryFee: 0m,
                GrandTotal: 0m
            );
        }

        var itemDtos = cart.Items.Select(item =>
        {
            var product = item.Product;
            var vendor = product.Vendor;
            var inventory = product.Inventory;

            var qtyAvailable = inventory?.QuantityAvailable ?? 0;
            var isAvailable = product.Status == ProductStatus.Active &&
                              vendor.Status == "Approved" &&
                              qtyAvailable >= item.Quantity;

            var mainImage = product.Images?.FirstOrDefault(img => img.IsMain)?.ImageUrl
                            ?? product.Images?.FirstOrDefault()?.ImageUrl
                            ?? "/assets/placeholder.png";

            return new CartItemDto(
                Id: item.Id,
                ProductId: item.ProductId,
                ProductName: product.Name,
                ProductSlug: product.Slug,
                ProductImageUrl: mainImage,
                SKU: product.SKU,
                UnitPrice: item.UnitPrice,
                Quantity: item.Quantity,
                TotalPrice: item.UnitPrice * item.Quantity,
                QuantityAvailable: qtyAvailable,
                IsAvailable: isAvailable,
                VendorId: vendor.Id,
                VendorStoreName: vendor.StoreName
            );
        }).ToList();

        var vendorGroups = itemDtos
            .GroupBy(i => i.VendorId)
            .Select(g => new VendorGroupedCartDto(
                VendorId: g.Key,
                VendorStoreName: g.First().VendorStoreName,
                Items: g.ToList(),
                SubTotal: g.Sum(x => x.TotalPrice)
            ))
            .ToList();

        var totalItems = itemDtos.Sum(i => i.Quantity);
        var subTotal = itemDtos.Sum(i => i.TotalPrice);
        var deliveryFee = subTotal > 0 ? _marketplaceOptions.FlatDeliveryFee : 0m;
        var grandTotal = subTotal + deliveryFee;

        return new CartDto(
            Id: cart.Id,
            CustomerId: cart.CustomerId,
            VendorGroups: vendorGroups,
            TotalItems: totalItems,
            SubTotal: subTotal,
            EstimatedDeliveryFee: deliveryFee,
            GrandTotal: grandTotal
        );
    }
}
