using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using LocalMart.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.Products.Queries;

public record GetProductDetailQuery(
    string IdOrSlug
) : IRequest<ProductDetailDto>;

public class GetProductDetailQueryHandler : IRequestHandler<GetProductDetailQuery, ProductDetailDto>
{
    private readonly IApplicationDbContext _context;

    public GetProductDetailQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProductDetailDto> Handle(GetProductDetailQuery request, CancellationToken cancellationToken)
    {
        Guid.TryParse(request.IdOrSlug, out var parsedId);

        var product = await _context.Products
            .Include(p => p.Vendor)
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Include(p => p.Inventory)
            .Where(p => p.Status == ProductStatus.Active
                     && p.Vendor.Status == "Approved"
                     && p.Inventory != null && p.Inventory.QuantityAvailable > 0)
            .FirstOrDefaultAsync(p => p.Id == parsedId || p.Slug.ToLower() == request.IdOrSlug.Trim().ToLower(), cancellationToken);

        if (product == null)
        {
            throw new KeyNotFoundException($"Product '{request.IdOrSlug}' was not found or is not available.");
        }

        var images = product.Images.Select(i => i.ImageUrl).ToList();
        if (!images.Any())
        {
            images.Add("/assets/placeholder.png");
        }

        var qtyAvailable = product.Inventory?.QuantityAvailable ?? 0;

        return new ProductDetailDto(
            product.Id,
            product.VendorId,
            product.Vendor.StoreName,
            product.Category.Id,
            product.Category.Name,
            product.Name,
            product.Slug,
            product.Description,
            product.SKU,
            product.Price,
            product.Status.ToString(),
            images,
            qtyAvailable,
            true, // inStock is guaranteed true by the visibility query filter
            product.CreatedAt
        );
    }
}
