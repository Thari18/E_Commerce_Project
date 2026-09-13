using System;
using System.Security.Cryptography;
using System.Text;
using FluentValidation;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using LocalMart.Domain.Entities;
using LocalMart.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LocalMart.Application.Features.VendorApplications.Commands;

public record ApproveVendorApplicationCommand(
    Guid ApplicationId,
    Guid AdminUserId,
    decimal CommissionRate = 10.00m
) : IRequest<ApproveVendorApplicationResponseDto>;

public class ApproveVendorApplicationCommandValidator : AbstractValidator<ApproveVendorApplicationCommand>
{
    public ApproveVendorApplicationCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty().WithMessage("Application ID is required.");
        RuleFor(x => x.AdminUserId).NotEmpty().WithMessage("Admin User ID is required.");
        RuleFor(x => x.CommissionRate).InclusiveBetween(0.00m, 100.00m).WithMessage("Commission rate must be between 0% and 100%.");
    }
}

public class ApproveVendorApplicationCommandHandler : IRequestHandler<ApproveVendorApplicationCommand, ApproveVendorApplicationResponseDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService? _emailService;
    private readonly FrontendSettings _frontendSettings;

    public ApproveVendorApplicationCommandHandler(
        IApplicationDbContext context, 
        IEmailService? emailService = null,
        IOptions<FrontendSettings>? frontendOptions = null)
    {
        _context = context;
        _emailService = emailService;
        _frontendSettings = frontendOptions?.Value ?? new FrontendSettings();
    }

    public async Task<ApproveVendorApplicationResponseDto> Handle(ApproveVendorApplicationCommand request, CancellationToken cancellationToken)
    {
        var application = await _context.VendorApplications
            .Include(a => a.ApplicantUser)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken);

        if (application == null)
        {
            throw new KeyNotFoundException($"Vendor application with ID '{request.ApplicationId}' was not found.");
        }

        if (application.Status == "Approved")
        {
            throw new InvalidOperationException($"Vendor application '{request.ApplicationId}' is already approved.");
        }

        if (application.Status == "Rejected")
        {
            throw new InvalidOperationException($"Cannot approve a rejected vendor application.");
        }

        // 1. Update Application Status
        application.Status = "Approved";
        application.ReviewedByAdminId = request.AdminUserId;
        application.ReviewedAt = DateTime.UtcNow;

        // 2. Create 1:1 Vendor entity record if not already created (guarantees UNIQUE(application_id))
        var existingVendor = await _context.Vendors.FirstOrDefaultAsync(v => v.ApplicationId == application.Id, cancellationToken);
        Vendor vendor;

        if (existingVendor == null)
        {
            // Only public store profile assets and location are mapped to Vendor.
            // Private verification assets (OwnerPhotoRef, ID documents, Certificates) are STRICTLY excluded.
            vendor = new Vendor
            {
                Id = Guid.NewGuid(),
                UserId = application.ApplicantUserId,
                ApplicationId = application.Id,
                StoreName = application.BusinessName,
                Description = !string.IsNullOrWhiteSpace(application.BusinessDescription) 
                    ? application.BusinessDescription 
                    : $"Store profile for {application.BusinessName}",
                LogoUrl = application.StoreLogoRef ?? string.Empty,
                BannerUrl = application.StoreFrontPhotoRef ?? string.Empty,
                Latitude = application.Latitude ?? 0.0,
                Longitude = application.Longitude ?? 0.0,
                Status = "Approved",
                CommissionRate = request.CommissionRate
            };
            _context.Vendors.Add(vendor);
        }
        else
        {
            vendor = existingVendor;
            vendor.Status = "Approved";
            if (!string.IsNullOrWhiteSpace(application.StoreLogoRef)) vendor.LogoUrl = application.StoreLogoRef;
            if (!string.IsNullOrWhiteSpace(application.StoreFrontPhotoRef)) vendor.BannerUrl = application.StoreFrontPhotoRef;
            if (application.Latitude.HasValue) vendor.Latitude = application.Latitude.Value;
            if (application.Longitude.HasValue) vendor.Longitude = application.Longitude.Value;
        }

        // 3. Provision Vendor Role to Applicant User
        var vendorRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Vendor", cancellationToken);
        if (vendorRole != null)
        {
            var hasVendorRole = await _context.UserRoles.AnyAsync(ur => ur.UserId == application.ApplicantUserId && ur.RoleId == vendorRole.Id, cancellationToken);
            if (!hasVendorRole)
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = application.ApplicantUserId,
                    RoleId = vendorRole.Id
                });
            }
        }

        // 4. Onboarding Authentication Flow: Guest Vendor vs Existing Customer
        var user = application.ApplicantUser;
        var needsPasswordSetup = user != null && string.IsNullOrWhiteSpace(user.PasswordHash);

        if (needsPasswordSetup && user != null)
        {
            // Generate 256-bit cryptographically secure token
            var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
            var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

            var setupToken = new PasswordResetToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = tokenHash,
                TokenType = "VendorActivation",
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                IsUsed = false
            };

            _context.PasswordResetTokens.Add(setupToken);
            await _context.SaveChangesAsync(cancellationToken);

            var baseUrl = !string.IsNullOrWhiteSpace(_frontendSettings.BaseUrl)
                ? _frontendSettings.BaseUrl.TrimEnd('/')
                : "http://localhost:4200";

            var setupUrl = $"{baseUrl}/vendor/set-password?token={rawToken}";
            if (_emailService != null)
            {
                await _emailService.SendVendorApprovalPasswordSetupEmailAsync(
                    recipientEmail: application.ContactEmail,
                    recipientName: application.OwnerFullName,
                    setupUrl: setupUrl,
                    cancellationToken: cancellationToken
                );
            }
        }
        else
        {
            await _context.SaveChangesAsync(cancellationToken);

            if (_emailService != null)
            {
                await _emailService.SendVendorApprovalNotificationEmailAsync(
                    recipientEmail: application.ContactEmail,
                    recipientName: application.OwnerFullName,
                    cancellationToken: cancellationToken
                );
            }
        }

        return new ApproveVendorApplicationResponseDto(
            application.Id,
            vendor.Id,
            application.Status,
            $"Vendor application for '{application.BusinessName}' has been successfully approved and Vendor role provisioned."
        );
    }
}
