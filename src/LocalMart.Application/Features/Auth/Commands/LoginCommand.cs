using System.Security.Cryptography;
using System.Text;
using FluentValidation;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using LocalMart.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.Auth.Commands;

public record LoginCommand(
    string Email,
    string Password
) : IRequest<AuthResponseDto>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password credentials.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Account is inactive or suspended.");
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
