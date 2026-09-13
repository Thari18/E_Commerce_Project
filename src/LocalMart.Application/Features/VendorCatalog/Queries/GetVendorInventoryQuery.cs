using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.VendorCatalog.Queries;

public record GetVendorInventoryQuery(
    Guid UserId
) : IRequest<List<VendorInventoryItemDto>>;

public class GetVendorInventoryQueryHandler : IRequestHandler<GetVendorInventoryQuery, List<VendorInventoryItemDto>>
{
    private readonly IApplicationDbContext _context;

    public GetVendorInventoryQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<VendorInventoryItemDto>> Handle(GetVendorInventoryQuery request, CancellationToken cancellationToken)
    {
        var vendor = await _context.Vendors
            .FirstOrDefaultAsync(v => v.UserId == request.UserId, cancellationToken);

        if (vendor == null || !string.Equals(vendor.Status, "Approved", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Only approved vendors are permitted to access vendor inventory.");
        }

        var items = await _context.Inventories
            .Include(i => i.Product)
            .Where(i => i.Product.VendorId == vendor.Id)
            .OrderBy(i => i.Product.Name)
            .Select(i => new VendorInventoryItemDto(
                i.Id,
                i.ProductId,
                i.Product.Name,
                i.Product.SKU,
                i.Product.Status.ToString(),
                i.QuantityAvailable,
                i.QuantityReserved,
                i.QuantityAvailable + i.QuantityReserved,
                i.UpdatedAt ?? i.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return items;
    }
}
