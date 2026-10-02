using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.Features.Cart.DTOs;
using LocalMart.Application.Features.Cart.Queries;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.Cart.Commands;

public record RemoveCartItemCommand(Guid CustomerId, Guid CartItemId) : IRequest<CartDto>;

public class RemoveCartItemCommandHandler : IRequestHandler<RemoveCartItemCommand, CartDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ISender _sender;

    public RemoveCartItemCommandHandler(IApplicationDbContext context, ISender sender)
    {
        _context = context;
        _sender = sender;
    }

    public async Task<CartDto> Handle(RemoveCartItemCommand request, CancellationToken cancellationToken)
    {
        var cartItem = await _context.CartItems
            .Include(ci => ci.Cart)
            .FirstOrDefaultAsync(ci => ci.Id == request.CartItemId && ci.Cart.CustomerId == request.CustomerId, cancellationToken);

        if (cartItem == null)
        {
            throw new KeyNotFoundException($"Cart item with ID '{request.CartItemId}' was not found.");
        }

        _context.CartItems.Remove(cartItem);
        await _context.SaveChangesAsync(cancellationToken);

        return await _sender.Send(new GetCartQuery(request.CustomerId), cancellationToken);
    }
}
