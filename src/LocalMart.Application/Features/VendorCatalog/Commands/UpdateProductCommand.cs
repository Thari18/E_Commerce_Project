using FluentValidation;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.VendorCatalog.Commands;

public record UpdateProductCommand(
    Guid UserId,
    Guid ProductId,
    Guid CategoryId,
    string Name,
    string Description,
    string Sku,
    decimal Price
) : IRequest<VendorProductItemDto>;

public class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.Sku).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Price).GreaterThan(0);
    }
}

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, VendorProductItemDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VendorProductItemDto> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var vendor = await _context.Vendors
            .FirstOrDefaultAsync(v => v.UserId == request.UserId, cancellationToken);

        if (vendor == null || !string.Equals(vendor.Status, "Approved", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Only approved vendors are permitted to update products.");
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

        // Vendor Tenant Ownership Isolation Verification
        if (product.VendorId != vendor.Id)
        {
            throw new UnauthorizedAccessException("Access denied. You can only update products owned by your vendor store.");
        }

        // Category Verification
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId, cancellationToken);

        if (category == null)
        {
            throw new KeyNotFoundException($"Category with ID '{request.CategoryId}' does not exist.");
        }

        // SKU uniqueness check (excluding self)
        var skuExists = await _context.Products
            .AnyAsync(p => p.SKU.ToLower() == request.Sku.Trim().ToLower() && p.Id != request.ProductId, cancellationToken);

        if (skuExists)
        {
            throw new InvalidOperationException($"Another product with SKU '{request.Sku}' already exists.");
        }

        product.CategoryId = request.CategoryId;
        product.Name = request.Name.Trim();
        product.Description = request.Description.Trim();
        product.SKU = request.Sku.Trim().ToUpper();
        product.Price = request.Price;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var primaryImg = product.Images.FirstOrDefault(i => i.IsMain)?.ImageUrl;
        var qtyAvailable = product.Inventory?.QuantityAvailable ?? 0;
        var qtyReserved = product.Inventory?.QuantityReserved ?? 0;

        return new VendorProductItemDto(
            product.Id,
            category.Id,
            category.Name,
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
