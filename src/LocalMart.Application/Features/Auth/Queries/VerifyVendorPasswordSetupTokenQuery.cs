using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.Auth.Queries;

public record VerifyVendorPasswordSetupTokenQuery(string Token) : IRequest<VerifyVendorTokenResponseDto>;

public class VerifyVendorPasswordSetupTokenQueryHandler : IRequestHandler<VerifyVendorPasswordSetupTokenQuery, VerifyVendorTokenResponseDto>
{
    private readonly IApplicationDbContext _context;

    public VerifyVendorPasswordSetupTokenQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VerifyVendorTokenResponseDto> Handle(VerifyVendorPasswordSetupTokenQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return new VerifyVendorTokenResponseDto(false, null, "Setup token is missing or empty.");
        }

        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(request.Token.Trim())));

        var tokenRecord = await _context.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.TokenType == "VendorActivation", cancellationToken);

        if (tokenRecord == null)
        {
            return new VerifyVendorTokenResponseDto(false, null, "Invalid or unrecognized setup token.");
        }

        if (tokenRecord.IsUsed)
        {
            return new VerifyVendorTokenResponseDto(false, null, "This activation token has already been used.");
        }

        if (tokenRecord.ExpiresAt <= DateTime.UtcNow)
        {
            return new VerifyVendorTokenResponseDto(false, null, "This activation token has expired. Please contact support.");
        }

        var maskedEmail = MaskEmail(tokenRecord.User.Email);

        return new VerifyVendorTokenResponseDto(true, maskedEmail, null);
    }

    private static string MaskEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            return "user@localmart.com";

        var parts = email.Split('@');
        var name = parts[0];
        var domain = parts[1];

        if (name.Length <= 2)
            return $"{name}***@{domain}";

        return $"{name[..2]}***{name[^1..]}@{domain}";
    }
}
