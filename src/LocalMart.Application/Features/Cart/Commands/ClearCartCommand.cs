using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.Features.Cart.DTOs;
using LocalMart.Application.Features.Cart.Queries;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.Cart.Commands;

public record ClearCartCommand(Guid CustomerId) : IRequest<CartDto>;

public class ClearCartCommandHandler : IRequestHandler<ClearCartCommand, CartDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ISender _sender;

    public ClearCartCommandHandler(IApplicationDbContext context, ISender sender)
    {
        _context = context;
        _sender = sender;
    }

    public async Task<CartDto> Handle(ClearCartCommand request, CancellationToken cancellationToken)
    {
        var cart = await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.CustomerId == request.CustomerId, cancellationToken);

        if (cart != null && cart.Items.Any())
        {
            _context.CartItems.RemoveRange(cart.Items);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return await _sender.Send(new GetCartQuery(request.CustomerId), cancellationToken);
    }
}
