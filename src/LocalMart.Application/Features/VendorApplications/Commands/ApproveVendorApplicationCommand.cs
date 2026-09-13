using FluentValidation;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using LocalMart.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

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

    public ApproveVendorApplicationCommandHandler(IApplicationDbContext context)
    {
        _context = context;
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
            vendor = new Vendor
            {
                Id = Guid.NewGuid(),
                UserId = application.ApplicantUserId,
                ApplicationId = application.Id,
                StoreName = application.BusinessName,
                Description = $"Store profile for {application.BusinessName}",
                Status = "Approved",
                CommissionRate = request.CommissionRate
            };
            _context.Vendors.Add(vendor);
        }
        else
        {
            vendor = existingVendor;
            vendor.Status = "Approved";
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

        await _context.SaveChangesAsync(cancellationToken);

        return new ApproveVendorApplicationResponseDto(
            application.Id,
            vendor.Id,
            application.Status,
            $"Vendor application for '{application.BusinessName}' has been successfully approved and Vendor role provisioned."
        );
    }
}
