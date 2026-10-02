using System.Security.Claims;
using LocalMart.Application.Features.Orders.DTOs;
using LocalMart.Application.Features.Orders.Commands;
using LocalMart.Application.Features.Orders.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LocalMart.WebAPI.Controllers;

[ApiController]
[Route("api/v1/orders")]
[Authorize(Roles = "Customer")]
public class OrdersController : ApiController
{
    [HttpPost("/api/v1/checkout/validate")]
    [ProducesResponseType(typeof(CheckoutValidationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ValidateCheckout([FromBody] ValidateCheckoutRequestDto dto, CancellationToken ct = default)
    {
        var query = new ValidateCheckoutQuery(GetCurrentUserId(), dto.ShippingAddressId, dto.CouponCode);
        var result = await Mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateOrder(
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
        [FromBody] CreateOrderRequestDto dto,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey))
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Missing Header",
                Detail = "The Idempotency-Key header is required for order creation.",
                Instance = HttpContext.Request.Path
            });
        }

        var command = new CreateOrderCommand(GetCurrentUserId(), dto.ShippingAddressId, dto.PaymentMethod, dto.CouponCode, idempotencyKey);
        var result = await Mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetOrderById), new { id = result.Id }, result);
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCustomerOrders(CancellationToken ct = default)
    {
        var query = new GetCustomerOrdersQuery(GetCurrentUserId());
        var result = await Mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrderById(Guid id, CancellationToken ct = default)
    {
        var query = new GetOrderByIdQuery(GetCurrentUserId(), id);
        var result = await Mediator.Send(query, ct);
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
