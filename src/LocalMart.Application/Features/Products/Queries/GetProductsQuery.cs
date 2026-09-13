using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using LocalMart.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.Products.Queries;

public record GetCategoriesQuery() : IRequest<List<CategoryDto>>;

public class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, List<CategoryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCategoriesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoryDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        return await _context.Categories
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Slug, c.ImageUrl))
            .ToListAsync(cancellationToken);
    }
}

public record GetProductsQuery(string? SearchQuery = null, Guid? CategoryId = null, int PageNumber = 1, int PageSize = 10) : IRequest<SearchProductsResponseDto>;

public class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, SearchProductsResponseDto>
{
    private readonly IApplicationDbContext _context;

    public GetProductsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SearchProductsResponseDto> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Products
            .Include(p => p.Vendor)
            .Include(p => p.Images)
            .Include(p => p.Inventory)
            .Where(p => p.Status == Domain.Enums.ProductStatus.Active
                     && p.Vendor.Status == "Approved"
                     && p.Inventory != null && p.Inventory.QuantityAvailable > 0);

        if (!string.IsNullOrWhiteSpace(request.SearchQuery))
        {
            var term = request.SearchQuery.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(term) || p.Description.ToLower().Contains(term));
        }

        if (request.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var products = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new ProductDto(
                p.Id,
                p.Name,
                p.Slug,
                p.Description,
                p.Price,
                p.Vendor.StoreName,
                p.Images.Where(img => img.IsMain).Select(img => img.ImageUrl).FirstOrDefault() ?? "/assets/placeholder.png",
                p.Status.ToString()
            ))
            .ToListAsync(cancellationToken);

        return new SearchProductsResponseDto(products, totalCount, request.PageNumber, request.PageSize);
    }
}
