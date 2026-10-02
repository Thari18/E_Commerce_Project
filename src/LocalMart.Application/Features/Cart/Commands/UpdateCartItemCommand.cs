using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.Features.Cart.DTOs;
using LocalMart.Application.Features.Cart.Queries;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.Cart.Commands;

public record UpdateCartItemCommand(Guid CustomerId, Guid CartItemId, int Quantity) : IRequest<CartDto>;

public class UpdateCartItemCommandHandler : IRequestHandler<UpdateCartItemCommand, CartDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ISender _sender;

    public UpdateCartItemCommandHandler(IApplicationDbContext context, ISender sender)
    {
        _context = context;
        _sender = sender;
    }

    public async Task<CartDto> Handle(UpdateCartItemCommand request, CancellationToken cancellationToken)
    {
        var cartItem = await _context.CartItems
            .Include(ci => ci.Cart)
            .Include(ci => ci.Product)
                .ThenInclude(p => p.Inventory)
            .FirstOrDefaultAsync(ci => ci.Id == request.CartItemId && ci.Cart.CustomerId == request.CustomerId, cancellationToken);

        if (cartItem == null)
        {
            throw new KeyNotFoundException($"Cart item with ID '{request.CartItemId}' was not found.");
        }

        if (request.Quantity <= 0)
        {
            _context.CartItems.Remove(cartItem);
            await _context.SaveChangesAsync(cancellationToken);
            return await _sender.Send(new GetCartQuery(request.CustomerId), cancellationToken);
        }

        var availableQty = cartItem.Product.Inventory?.QuantityAvailable ?? 0;
        if (request.Quantity > availableQty)
        {
            throw new InvalidOperationException($"Cannot update quantity to {request.Quantity}. Maximum available stock is {availableQty}.");
        }

        cartItem.Quantity = request.Quantity;
        cartItem.UnitPrice = cartItem.Product.Price; // Re-sync snapshot price
        cartItem.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await _sender.Send(new GetCartQuery(request.CustomerId), cancellationToken);
    }
}
