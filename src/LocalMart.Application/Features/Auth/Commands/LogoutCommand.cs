using System.Security.Cryptography;
using System.Text;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.Auth.Commands;

public record LogoutCommand(
    string? RefreshToken,
    Guid? UserId = null
) : IRequest<LogoutResponseDto>;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand, LogoutResponseDto>
{
    private readonly IApplicationDbContext _context;

    public LogoutCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<LogoutResponseDto> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            var rawToken = request.RefreshToken;
            var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

            var storedToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(r => (r.Token == tokenHash || r.Token == rawToken) && !r.IsRevoked, cancellationToken);

            if (storedToken != null)
            {
                storedToken.IsRevoked = true;
                storedToken.RevokedAt = now;
            }
        }

        if (request.UserId.HasValue && request.UserId.Value != Guid.Empty)
        {
            var userTokens = await _context.RefreshTokens
                .Where(r => r.UserId == request.UserId.Value && !r.IsRevoked)
                .ToListAsync(cancellationToken);

            foreach (var token in userTokens)
            {
                token.IsRevoked = true;
                token.RevokedAt = now;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new LogoutResponseDto(
            Success: true,
            Message: "User session successfully logged out and invalidated."
        );
    }
}
