using System.Security.Claims;
using LocalMart.Application.DTOs;
using LocalMart.Application.Features.VendorApplications.Commands;
using LocalMart.Application.Features.VendorApplications.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LocalMart.WebAPI.Controllers;

[ApiController]
[Route("api/v1/vendors")]
public class VendorsController : ApiController
{
    [HttpPost("applications")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VendorApplicationResponseDto), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SubmitApplication([FromBody] SubmitVendorApplicationRequestDto dto, CancellationToken ct)
    {
        Guid? userId = dto.ApplicantUserId;
        if ((!userId.HasValue || userId.Value == Guid.Empty) && User.Identity?.IsAuthenticated == true)
        {
            var nameIdentifier = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(nameIdentifier, out var parsedId))
            {
                userId = parsedId;
            }
        }

        var command = new SubmitVendorApplicationCommand(
            userId,
            dto.BusinessName,
            dto.BusinessRegistrationNumber,
            dto.TaxIdentificationNumber,
            dto.ContactPhone,
            dto.ContactEmail
        );

        try
        {
            var result = await Mediator.Send(command, ct);
            return Accepted(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Conflict",
                Detail = ex.Message,
                Status = StatusCodes.Status409Conflict
            });
        }
    }

    [HttpGet("applications/status")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VendorApplicationStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetApplicationStatus(
        [FromQuery] Guid? applicationId,
        [FromQuery] string? email,
        CancellationToken ct)
    {
        Guid? currentUserId = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            var nameIdentifier = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(nameIdentifier, out var parsedId))
            {
                currentUserId = parsedId;
            }
        }

        var query = new GetVendorApplicationStatusQuery(applicationId, email, currentUserId);
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
}
