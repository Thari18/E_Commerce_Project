using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using LocalMart.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.Auth.Commands;

public record SocialLoginCommand(
    string Provider,
    string? Email = null,
    string? Name = null
) : IRequest<AuthResponseDto>;

public class SocialLoginCommandValidator : AbstractValidator<SocialLoginCommand>
{
    public SocialLoginCommandValidator()
    {
        RuleFor(x => x.Provider).NotEmpty();
    }
}

public class SocialLoginCommandHandler : IRequestHandler<SocialLoginCommand, AuthResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public SocialLoginCommandHandler(
        IApplicationDbContext context,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(SocialLoginCommand request, CancellationToken cancellationToken)
    {
        var providerName = request.Provider.Trim();
        var targetEmail = !string.IsNullOrWhiteSpace(request.Email)
            ? request.Email.Trim().ToLower()
            : $"{providerName.ToLower()}.user@localmart.com";

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == targetEmail, cancellationToken);

        if (user == null)
        {
            // Auto-register social user with Customer role
            var customerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Customer", cancellationToken);
            var userId = Guid.NewGuid();

            user = new User
            {
                Id = userId,
                Email = targetEmail,
                PasswordHash = "SOCIAL_AUTH_NOPASSWORD",
                FirstName = request.Name ?? $"{providerName} User",
                LastName = "(Social)",
                PhoneNumber = "+1000000000",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);

            if (customerRole != null)
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = userId,
                    RoleId = customerRole.Id
                });
            }

            await _context.SaveChangesAsync(cancellationToken);

            user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstAsync(u => u.Id == userId, cancellationToken);
        }

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        if (!roles.Any())
        {
            roles.Add("Customer");
        }

        var accessToken = _jwtTokenGenerator.GenerateAccessToken(user.Id, user.Email, roles);
        var refreshTokenString = _jwtTokenGenerator.GenerateRefreshToken();
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(refreshTokenString)));

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto(
            AccessToken: accessToken,
            RefreshToken: refreshTokenString,
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
