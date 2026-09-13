using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.Auth.Commands;

public record SetVendorPasswordCommand(
    string Token,
    string NewPassword,
    string ConfirmPassword
) : IRequest<SetVendorPasswordResponseDto>;

public class SetVendorPasswordCommandValidator : AbstractValidator<SetVendorPasswordCommand>
{
    public SetVendorPasswordCommandValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Activation token is required.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter.")
            .Matches(@"[0-9]").WithMessage("Password must contain at least one digit.")
            .Matches(@"[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character.");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.NewPassword).WithMessage("Passwords do not match.");
    }
}

public class SetVendorPasswordCommandHandler : IRequestHandler<SetVendorPasswordCommand, SetVendorPasswordResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public SetVendorPasswordCommandHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<SetVendorPasswordResponseDto> Handle(SetVendorPasswordCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            throw new ArgumentException("Activation token is required.");
        }

        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(request.Token.Trim())));

        var tokenRecord = await _context.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.TokenType == "VendorActivation", cancellationToken);

        if (tokenRecord == null)
        {
            throw new KeyNotFoundException("Invalid or unrecognized setup token.");
        }

        if (tokenRecord.IsUsed)
        {
            throw new InvalidOperationException("This activation token has already been used.");
        }

        if (tokenRecord.ExpiresAt <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("This activation token has expired. Please contact administrator.");
        }

        // Set password & ensure user is active
        tokenRecord.User.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        tokenRecord.User.IsActive = true;
        tokenRecord.User.UpdatedAt = DateTime.UtcNow;

        // Consume token (single use)
        tokenRecord.IsUsed = true;
        tokenRecord.UsedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new SetVendorPasswordResponseDto(
            Success: true,
            Message: "Password has been successfully created. You can now log in to the Vendor Portal."
        );
    }
}
