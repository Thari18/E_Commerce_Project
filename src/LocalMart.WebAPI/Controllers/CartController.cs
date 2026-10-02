using System.Security.Claims;
using LocalMart.Application.Features.Cart.DTOs;
using LocalMart.Application.Features.Cart.Commands;
using LocalMart.Application.Features.Cart.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LocalMart.WebAPI.Controllers;

[ApiController]
[Route("api/v1/cart")]
[Authorize(Roles = "Customer")]
public class CartController : ApiController
{
    [HttpGet]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCart(CancellationToken ct = default)
    {
        var query = new GetCartQuery(GetCurrentUserId());
        var result = await Mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpPost("items")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddToCart([FromBody] AddToCartRequestDto dto, CancellationToken ct = default)
    {
        var command = new AddToCartCommand(GetCurrentUserId(), dto.ProductId, dto.Quantity);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpPut("items/{id:guid}")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCartItem(Guid id, [FromBody] UpdateCartItemRequestDto dto, CancellationToken ct = default)
    {
        var command = new UpdateCartItemCommand(GetCurrentUserId(), id, dto.Quantity);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpDelete("items/{id:guid}")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveCartItem(Guid id, CancellationToken ct = default)
    {
        var command = new RemoveCartItemCommand(GetCurrentUserId(), id);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpDelete]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ClearCart(CancellationToken ct = default)
    {
        var command = new ClearCartCommand(GetCurrentUserId());
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(claim, out var userId))
        {
            return userId;
        }
        throw new UnauthorizedAccessException("User authentication token is invalid or missing user identifier.");
    }
}
