using FluentValidation;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using LocalMart.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.VendorApplications.Commands;

public record SubmitVendorApplicationCommand(
    Guid? ApplicantUserId,
    string BusinessName,
    string BusinessRegistrationNumber,
    string? TaxIdentificationNumber,
    string ContactPhone,
    string ContactEmail
) : IRequest<VendorApplicationResponseDto>;

public class SubmitVendorApplicationCommandValidator : AbstractValidator<SubmitVendorApplicationCommand>
{
    public SubmitVendorApplicationCommandValidator()
    {
        RuleFor(x => x.BusinessName).NotEmpty().MaximumLength(150).WithMessage("Business Name is required (max 150 characters).");
        RuleFor(x => x.BusinessRegistrationNumber).NotEmpty().MaximumLength(100).WithMessage("Business Registration Number is required.");
        RuleFor(x => x.ContactPhone).NotEmpty().MaximumLength(20).WithMessage("Contact Phone is required.");
        RuleFor(x => x.ContactEmail).NotEmpty().EmailAddress().MaximumLength(255).WithMessage("Valid Contact Email is required.");
    }
}

public class SubmitVendorApplicationCommandHandler : IRequestHandler<SubmitVendorApplicationCommand, VendorApplicationResponseDto>
{
    private readonly IApplicationDbContext _context;

    public SubmitVendorApplicationCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VendorApplicationResponseDto> Handle(SubmitVendorApplicationCommand request, CancellationToken cancellationToken)
    {
        // 1. Resolve or establish Applicant User identity (API_CONTRACT.md Section 7.2 Rule 1)
        User? user = null;

        if (request.ApplicantUserId.HasValue && request.ApplicantUserId.Value != Guid.Empty)
        {
            user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.ApplicantUserId.Value, cancellationToken);
        }

        var normalizedEmail = request.ContactEmail.Trim().ToLowerInvariant();

        if (user == null)
        {
            user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);
        }

        if (user == null)
        {
            // Establish pending applicant user record (zero password fields in application payload)
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = normalizedEmail,
                PasswordHash = string.Empty,
                FirstName = request.BusinessName.Trim(),
                LastName = "Applicant",
                PhoneNumber = request.ContactPhone.Trim(),
                IsActive = true
            };

            _context.Users.Add(user);

            var customerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Customer", cancellationToken);
            if (customerRole != null)
            {
                _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = customerRole.Id });
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        // 2. Check duplicate pending/approved application for applicant user
        var existingApp = await _context.VendorApplications.FirstOrDefaultAsync(
            a => a.ApplicantUserId == user.Id && (a.Status == "Pending" || a.Status == "UnderReview" || a.Status == "Approved"),
            cancellationToken);

        if (existingApp != null)
        {
            throw new InvalidOperationException($"Applicant already has an active or pending vendor application (ID: '{existingApp.Id}', Status: '{existingApp.Status}').");
        }

        // 3. Check duplicate business registration number
        var duplicateReg = await _context.VendorApplications.AnyAsync(
            a => a.BusinessRegistrationNumber == request.BusinessRegistrationNumber && a.Status != "Rejected",
            cancellationToken);

        if (duplicateReg)
        {
            throw new InvalidOperationException($"A vendor application with Business Registration Number '{request.BusinessRegistrationNumber}' already exists.");
        }

        // 4. Create VendorApplication record
        var application = new VendorApplication
        {
            Id = Guid.NewGuid(),
            ApplicantUserId = user.Id,
            BusinessName = request.BusinessName.Trim(),
            BusinessRegistrationNumber = request.BusinessRegistrationNumber.Trim(),
            TaxIdentificationNumber = request.TaxIdentificationNumber?.Trim(),
            ContactPhone = request.ContactPhone.Trim(),
            ContactEmail = normalizedEmail,
            Status = "Pending",
            SubmittedAt = DateTime.UtcNow
        };

        _context.VendorApplications.Add(application);
        await _context.SaveChangesAsync(cancellationToken);

        // Note: User remains in Customer role. Vendor role is granted ONLY upon Admin approval.

        return new VendorApplicationResponseDto(
            application.Id,
            application.Status,
            application.SubmittedAt,
            "Vendor application submitted successfully and is awaiting administrator review."
        );
    }
}
