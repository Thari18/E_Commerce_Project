using System.Security.Cryptography;
using System.Text;
using FluentValidation;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using LocalMart.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.Auth.Commands;

public record RefreshTokenCommand(
    string RefreshToken
) : IRequest<AuthResponseDto>;

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty().WithMessage("Refresh token is required.");
    }
}

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public RefreshTokenCommandHandler(
        IApplicationDbContext context,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var rawToken = request.RefreshToken;
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

        var storedToken = await _context.RefreshTokens
            .Include(r => r.User)
            .ThenInclude(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(r => r.Token == tokenHash || r.Token == rawToken, cancellationToken);

        if (storedToken == null)
        {
            throw new UnauthorizedAccessException("Invalid refresh token.");
        }

        // Token Theft / Reuse Protection: If a revoked token is presented, invalidate ALL active user tokens
        if (storedToken.IsRevoked)
        {
            var activeUserTokens = await _context.RefreshTokens
                .Where(r => r.UserId == storedToken.UserId && !r.IsRevoked)
                .ToListAsync(cancellationToken);

            foreach (var t in activeUserTokens)
            {
                t.IsRevoked = true;
                t.RevokedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedAccessException("Revoked refresh token presented. Potential token reuse attempt detected. All active sessions have been invalidated.");
        }

        if (storedToken.ExpiresAt <= DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Refresh token has expired. Please log in again.");
        }

        var user = storedToken.User;
        if (user == null || !user.IsActive)
        {
            throw new UnauthorizedAccessException("User account is inactive or suspended.");
        }

        // Revoke current refresh token (Rotation)
        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTime.UtcNow;

        // Generate new refresh token & store its SHA-256 hash
        var newRefreshTokenString = _jwtTokenGenerator.GenerateRefreshToken();
        var newHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(newRefreshTokenString)));

        var newRefreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = newHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(newRefreshToken);

        // Regenerate claims/roles from current user state
        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        if (!roles.Any())
        {
            roles.Add("Customer");
        }

        var newAccessToken = _jwtTokenGenerator.GenerateAccessToken(user.Id, user.Email, roles);

        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto(
            AccessToken: newAccessToken,
            RefreshToken: newRefreshTokenString,
            ExpiresAt: DateTime.UtcNow.AddHours(1),
            User: new UserProfileDto(
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.PhoneNumber,
                roles
            )
        );
    }
}
