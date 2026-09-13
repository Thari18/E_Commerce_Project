using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using LocalMart.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.VendorCatalog.Queries;

public record GetVendorProductsQuery(
    Guid UserId,
    string? StatusFilter = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<VendorProductsResponseDto>;

public class GetVendorProductsQueryHandler : IRequestHandler<GetVendorProductsQuery, VendorProductsResponseDto>
{
    private readonly IApplicationDbContext _context;

    public GetVendorProductsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VendorProductsResponseDto> Handle(GetVendorProductsQuery request, CancellationToken cancellationToken)
    {
        var vendor = await _context.Vendors
            .FirstOrDefaultAsync(v => v.UserId == request.UserId, cancellationToken);

        if (vendor == null || !string.Equals(vendor.Status, "Approved", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Only approved vendors are permitted to access vendor products.");
        }

        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Include(p => p.Inventory)
            .Where(p => p.VendorId == vendor.Id);

        if (!string.IsNullOrWhiteSpace(request.StatusFilter) && Enum.TryParse<ProductStatus>(request.StatusFilter, true, out var statusEnum))
        {
            query = query.Where(p => p.Status == statusEnum);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var products = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new VendorProductItemDto(
                p.Id,
                p.Category.Id,
                p.Category.Name,
                p.Name,
                p.Slug,
                p.Description,
                p.SKU,
                p.Price,
                p.Status.ToString(),
                p.Images.Where(i => i.IsMain).Select(i => i.ImageUrl).FirstOrDefault() ?? "/assets/placeholder.png",
                p.Inventory != null ? p.Inventory.QuantityAvailable : 0,
                p.Inventory != null ? p.Inventory.QuantityReserved : 0,
                p.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return new VendorProductsResponseDto(products, totalCount, request.PageNumber, request.PageSize);
    }
}
