using System.Security.Claims;
using LocalMart.Application.DTOs;
using LocalMart.Application.Features.VendorCatalog.Commands;
using LocalMart.Application.Features.VendorCatalog.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LocalMart.WebAPI.Controllers;

[ApiController]
[Route("api/v1/vendor/inventory")]
[Authorize(Roles = "Vendor")]
public class VendorInventoryController : ApiController
{
    [HttpGet]
    [ProducesResponseType(typeof(List<VendorInventoryItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetVendorInventory(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var query = new GetVendorInventoryQuery(userId);
        var result = await Mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpPut("{productId}")]
    [ProducesResponseType(typeof(UpdateInventoryResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateInventory(Guid productId, [FromBody] UpdateInventoryRequestDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var command = new UpdateInventoryCommand(userId, productId, dto.QuantityAvailable);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(claim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid or missing user context.");
        }
        return userId;
    }
}
