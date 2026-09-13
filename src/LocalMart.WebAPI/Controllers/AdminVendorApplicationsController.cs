using System.Security.Claims;
using LocalMart.Application.DTOs;
using LocalMart.Application.Features.VendorApplications.Commands;
using LocalMart.Application.Features.VendorApplications.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LocalMart.WebAPI.Controllers;

[ApiController]
[Route("api/v1/admin/vendors/applications")]
[Authorize(Roles = "Admin")]
public class AdminVendorApplicationsController : ApiController
{
    [HttpGet]
    [Authorize(Roles = "Admin", Policy = "CanReadVendorApplications")]
    [ProducesResponseType(typeof(List<VendorApplicationDetailDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetApplications(
        [FromQuery] string? statusFilter,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var query = new GetAdminVendorApplicationsQuery(statusFilter, pageNumber, pageSize);
        var result = await Mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin", Policy = "CanReadVendorApplications")]
    [ProducesResponseType(typeof(VendorApplicationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetApplicationById(Guid id, CancellationToken ct)
    {
        var query = new GetAdminVendorApplicationByIdQuery(id);
        try
        {
            var result = await Mediator.Send(query, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Not Found",
                Detail = ex.Message,
                Status = StatusCodes.Status404NotFound
            });
        }
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = "Admin", Policy = "CanApproveVendors")]
    [ProducesResponseType(typeof(ApproveVendorApplicationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveApplication(
        Guid id,
        [FromBody] ApproveVendorApplicationRequestDto? dto,
        CancellationToken ct)
    {
        var adminUserIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(adminUserIdClaim, out var adminUserId))
        {
            return Unauthorized(new ProblemDetails
            {
                Title = "Unauthorized",
                Detail = "Valid Admin User ID claim is required.",
                Status = StatusCodes.Status401Unauthorized
            });
        }

        // PROVISIONAL / DEFERRED FIELD per Technical Decision #7 (Commission financial base/rate remains DEFERRED)
        var commissionRate = dto?.CommissionRate ?? 10.00m;
        var command = new ApproveVendorApplicationCommand(id, adminUserId, commissionRate);

        try
        {
            var result = await Mediator.Send(command, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Not Found",
                Detail = ex.Message,
                Status = StatusCodes.Status404NotFound
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Bad Request",
                Detail = ex.Message,
                Status = StatusCodes.Status400BadRequest
            });
        }
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = "Admin", Policy = "CanApproveVendors")]
    [ProducesResponseType(typeof(RejectVendorApplicationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectApplication(
        Guid id,
        [FromBody] RejectVendorApplicationRequestDto dto,
        CancellationToken ct)
    {
        var adminUserIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(adminUserIdClaim, out var adminUserId))
        {
            return Unauthorized(new ProblemDetails
            {
                Title = "Unauthorized",
                Detail = "Valid Admin User ID claim is required.",
                Status = StatusCodes.Status401Unauthorized
            });
        }

        var command = new RejectVendorApplicationCommand(id, adminUserId, dto.RejectionReason);

        try
        {
            var result = await Mediator.Send(command, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Not Found",
                Detail = ex.Message,
                Status = StatusCodes.Status404NotFound
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Bad Request",
                Detail = ex.Message,
                Status = StatusCodes.Status400BadRequest
            });
        }
    }
}
