using System.Security.Claims;
using LocalMart.Application.DTOs;
using LocalMart.Application.Features.Auth.Commands;
using LocalMart.Application.Features.Auth.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LocalMart.WebAPI.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ApiController
{
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] UserRegisterRequestDto request, CancellationToken ct)
    {
        var command = new RegisterUserCommand(
            request.Email,
            request.Password,
            request.FirstName,
            request.LastName,
            request.PhoneNumber
        );
        var result = await Mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetCurrentUser), result);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request, CancellationToken ct)
    {
        var command = new LoginCommand(request.Email, request.Password);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpPost("social-login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SocialLogin([FromBody] SocialLoginRequestDto request, CancellationToken ct)
    {
        var command = new SocialLoginCommand(request.Provider, request.Email, request.Name);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request, CancellationToken ct)
    {
        try
        {
            var command = new RefreshTokenCommand(request.RefreshToken);
            var result = await Mediator.Send(command, ct);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new ProblemDetails
            {
                Title = "Unauthorized",
                Detail = ex.Message,
                Status = StatusCodes.Status401Unauthorized
            });
        }
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LogoutResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout([FromBody] LogoutRequestDto? request, CancellationToken ct)
    {
        Guid? userId = null;
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(userIdClaim, out var parsedId))
        {
            userId = parsedId;
        }

        var command = new LogoutCommand(request?.RefreshToken, userId);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpGet("vendor/verify-token")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VerifyVendorTokenResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> VerifyVendorToken([FromQuery] string token, CancellationToken ct)
    {
        var query = new VerifyVendorPasswordSetupTokenQuery(token);
        var result = await Mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpPost("vendor/set-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SetVendorPasswordResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetVendorPassword([FromBody] SetVendorPasswordRequestDto request, CancellationToken ct)
    {
        var command = new SetVendorPasswordCommand(
            request.Token,
            request.NewPassword,
            request.ConfirmPassword
        );
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
                Title = "Invalid Operation",
                Detail = ex.Message,
                Status = StatusCodes.Status400BadRequest
            });
        }
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public IActionResult GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var email = User.FindFirstValue(ClaimTypes.Email);
        var roles = User.FindAll(ClaimTypes.Role).Select(r => r.Value).ToList();

        var profile = new UserProfileDto(
            Guid.Parse(userId ?? Guid.Empty.ToString()),
            email ?? string.Empty,
            User.FindFirstValue("given_name") ?? "User",
            User.FindFirstValue("family_name") ?? "",
            "",
            roles
        );

        return Ok(profile);
    }
}

