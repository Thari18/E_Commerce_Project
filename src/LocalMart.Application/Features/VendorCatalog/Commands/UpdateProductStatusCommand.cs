using FluentValidation;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using LocalMart.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.VendorCatalog.Commands;

public record UpdateProductStatusCommand(
    Guid UserId,
    Guid ProductId,
    string Status
) : IRequest<VendorProductItemDto>;

public class UpdateProductStatusCommandValidator : AbstractValidator<UpdateProductStatusCommand>
{
    public UpdateProductStatusCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Status)
            .Must(s => Enum.TryParse<ProductStatus>(s, true, out _))
            .WithMessage("Invalid status. Allowed values: Draft, Active, Inactive, OutOfStock, Suspended");
    }
}

public class UpdateProductStatusCommandHandler : IRequestHandler<UpdateProductStatusCommand, VendorProductItemDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateProductStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VendorProductItemDto> Handle(UpdateProductStatusCommand request, CancellationToken cancellationToken)
    {
        var vendor = await _context.Vendors
            .FirstOrDefaultAsync(v => v.UserId == request.UserId, cancellationToken);

        if (vendor == null || !string.Equals(vendor.Status, "Approved", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Only approved vendors are permitted to update product status.");
        }

        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Include(p => p.Inventory)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product == null)
        {
            throw new KeyNotFoundException($"Product with ID '{request.ProductId}' was not found.");
        }

        if (product.VendorId != vendor.Id)
        {
            throw new UnauthorizedAccessException("Access denied. You can only modify products owned by your vendor store.");
        }

        if (!Enum.TryParse<ProductStatus>(request.Status, true, out var newStatus))
        {
            throw new ArgumentException($"Invalid product status '{request.Status}'.");
        }

        // Prevent setting Active if QuantityAvailable <= 0
        if (newStatus == ProductStatus.Active && (product.Inventory == null || product.Inventory.QuantityAvailable <= 0))
        {
            newStatus = ProductStatus.OutOfStock;
        }

        product.Status = newStatus;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var primaryImg = product.Images.FirstOrDefault(i => i.IsMain)?.ImageUrl;
        var qtyAvailable = product.Inventory?.QuantityAvailable ?? 0;
        var qtyReserved = product.Inventory?.QuantityReserved ?? 0;

        return new VendorProductItemDto(
            product.Id,
            product.Category.Id,
            product.Category.Name,
            product.Name,
            product.Slug,
            product.Description,
            product.SKU,
            product.Price,
            product.Status.ToString(),
            primaryImg,
            qtyAvailable,
            qtyReserved,
            product.CreatedAt
        );
    }
}
