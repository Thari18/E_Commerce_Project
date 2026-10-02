using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.Features.Cart.DTOs;
using LocalMart.Application.Features.Cart.Queries;
using LocalMart.Domain.Entities;
using LocalMart.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using DomainCart = LocalMart.Domain.Entities.Cart;
using DomainCartItem = LocalMart.Domain.Entities.CartItem;

namespace LocalMart.Application.Features.Cart.Commands;

public record AddToCartCommand(Guid CustomerId, Guid ProductId, int Quantity = 1) : IRequest<CartDto>;

public class AddToCartCommandHandler : IRequestHandler<AddToCartCommand, CartDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ISender _sender;

    public AddToCartCommandHandler(IApplicationDbContext context, ISender sender)
    {
        _context = context;
        _sender = sender;
    }

    public async Task<CartDto> Handle(AddToCartCommand request, CancellationToken cancellationToken)
    {
        if (request.Quantity <= 0)
        {
            throw new ArgumentException("Quantity to add must be greater than zero.");
        }

        var product = await _context.Products
            .Include(p => p.Vendor)
            .Include(p => p.Inventory)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product == null)
        {
            throw new KeyNotFoundException($"Product with ID '{request.ProductId}' was not found.");
        }

        if (product.Status != ProductStatus.Active || product.Vendor.Status != "Approved")
        {
            throw new InvalidOperationException($"Product '{product.Name}' is not currently available for purchase.");
        }

        var availableQty = product.Inventory?.QuantityAvailable ?? 0;
        if (availableQty <= 0)
        {
            throw new InvalidOperationException($"Product '{product.Name}' is currently out of stock.");
        }

        var cart = await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.CustomerId == request.CustomerId, cancellationToken);

        if (cart == null)
        {
            cart = new DomainCart
            {
                Id = Guid.NewGuid(),
                CustomerId = request.CustomerId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Carts.Add(cart);
        }

        var existingItem = cart.Items.FirstOrDefault(i => i.ProductId == request.ProductId);
        var targetQuantity = (existingItem?.Quantity ?? 0) + request.Quantity;

        if (targetQuantity > availableQty)
        {
            throw new InvalidOperationException($"Cannot add {request.Quantity} items. Maximum available stock is {availableQty}.");
        }

        if (existingItem != null)
        {
            existingItem.Quantity = targetQuantity;
            existingItem.UnitPrice = product.Price; // Preserve UnitPrice snapshot
            existingItem.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            var newItem = new DomainCartItem
            {
                Id = Guid.NewGuid(),
                CartId = cart.Id,
                ProductId = request.ProductId,
                Quantity = request.Quantity,
                UnitPrice = product.Price, // UnitPrice snapshot
                CreatedAt = DateTime.UtcNow
            };
            _context.CartItems.Add(newItem);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await _sender.Send(new GetCartQuery(request.CustomerId), cancellationToken);
    }
}
