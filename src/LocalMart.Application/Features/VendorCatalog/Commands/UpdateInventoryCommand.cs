using FluentValidation;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using LocalMart.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.VendorCatalog.Commands;

public record UpdateInventoryCommand(
    Guid UserId,
    Guid ProductId,
    int QuantityAvailable
) : IRequest<UpdateInventoryResponseDto>;

public class UpdateInventoryCommandValidator : AbstractValidator<UpdateInventoryCommand>
{
    public UpdateInventoryCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.QuantityAvailable).GreaterThanOrEqualTo(0);
    }
}

public class UpdateInventoryCommandHandler : IRequestHandler<UpdateInventoryCommand, UpdateInventoryResponseDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateInventoryCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UpdateInventoryResponseDto> Handle(UpdateInventoryCommand request, CancellationToken cancellationToken)
    {
        var vendor = await _context.Vendors
            .FirstOrDefaultAsync(v => v.UserId == request.UserId, cancellationToken);

        if (vendor == null || !string.Equals(vendor.Status, "Approved", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Only approved vendors are permitted to update stock inventory.");
        }

        var product = await _context.Products
            .Include(p => p.Inventory)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product == null)
        {
            throw new KeyNotFoundException($"Product with ID '{request.ProductId}' was not found.");
        }

        if (product.VendorId != vendor.Id)
        {
            throw new UnauthorizedAccessException("Access denied. You can only update inventory for products owned by your vendor store.");
        }

        var inventory = product.Inventory;
        if (inventory == null)
        {
            inventory = new Domain.Entities.Inventory
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                QuantityAvailable = request.QuantityAvailable,
                QuantityReserved = 0,
                LowStockThreshold = 10,
                CreatedAt = DateTime.UtcNow
            };
            _context.Inventories.Add(inventory);
        }
        else
        {
            inventory.QuantityAvailable = request.QuantityAvailable;
            inventory.UpdatedAt = DateTime.UtcNow;
        }

        // Automatic Status Adjustment based on Available Stock
        if (request.QuantityAvailable <= 0 && product.Status == ProductStatus.Active)
        {
            product.Status = ProductStatus.OutOfStock;
        }
        else if (request.QuantityAvailable > 0 && product.Status == ProductStatus.OutOfStock)
        {
            product.Status = ProductStatus.Active;
        }

        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new UpdateInventoryResponseDto(
            product.Id,
            inventory.QuantityAvailable,
            inventory.QuantityReserved,
            inventory.UpdatedAt ?? DateTime.UtcNow,
            $"Inventory for '{product.Name}' updated to {inventory.QuantityAvailable} available units."
        );
    }
}
