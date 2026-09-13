using FluentValidation;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using LocalMart.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.VendorApplications.Commands;

public record SubmitVendorApplicationCommand(
    Guid? ApplicantUserId,

    // 1. Owner & Identity Details (Private Verification Assets)
    string OwnerFullName,
    string OwnerEmail,
    string OwnerPhone,
    string OwnershipType, // Individual, Partnership, Company
    string? ResidentialAddress = null,
    string? IdType = null,
    string? IdNumber = null,
    string? OwnerPhotoRef = null, // Private verification asset
    string? IdDocumentRef = null, // Private verification asset

    // 2. Business & Tax Details
    string BusinessName = "",
    string BusinessType = "RetailShop",
    string BusinessCategory = "",
    string? BusinessRegistrationNumber = null,
    string? BusinessDescription = null,
    DateTime? BusinessRegistrationDate = null,
    string? TaxIdentificationNumber = null, // TIN Number
    string? VatRegistrationNumber = null, // VAT Number (distinct from TIN)
    string ContactPhone = "",
    string ContactEmail = "",
    string? WebsiteUrl = null,
    string? SocialMediaUrl = null,

    // 3. Store Physical Location
    string AddressLine1 = "",
    string? AddressLine2 = null,
    string City = "",
    string District = "",
    string Province = "",
    string PostalCode = "",
    double? Latitude = null,
    double? Longitude = null,

    // 4. Verification Documents (Private Verification Assets — Conditional based on policy)
    string? BusinessRegistrationCertificateRef = null,
    string? TinCertificateRef = null,
    string? TradeLicenceRef = null,
    string? OtherLicenceRef = null,

    // 5. Store Profile Assets (Public Storefront)
    string? StoreFrontPhotoRef = null,
    string? BusinessNameboardPhotoRef = null,
    string? StoreInteriorPhotoRef = null,
    string? StoreLogoRef = null,

    // 6. Declarations
    bool TermsAccepted = false,
    bool MarketplacePolicyAccepted = false,
    bool InformationAccuracyConfirmed = false
) : IRequest<VendorApplicationResponseDto>;

public class SubmitVendorApplicationCommandValidator : AbstractValidator<SubmitVendorApplicationCommand>
{
    private static readonly string[] AllowedOwnershipTypes = ["Individual", "Sole Proprietor", "Partnership", "Company"];

    public SubmitVendorApplicationCommandValidator()
    {
        // Owner Details Validation
        RuleFor(x => x.OwnerFullName)
            .NotEmpty().WithMessage("Owner Full Name is required.")
            .MaximumLength(150).WithMessage("Owner Full Name cannot exceed 150 characters.");

        RuleFor(x => x.OwnerEmail)
            .NotEmpty().WithMessage("Owner Email is required.")
            .EmailAddress().WithMessage("A valid Owner Email address is required.")
            .MaximumLength(255).WithMessage("Owner Email cannot exceed 255 characters.");

        RuleFor(x => x.OwnerPhone)
            .NotEmpty().WithMessage("Owner Phone is required.")
            .MaximumLength(30).WithMessage("Owner Phone cannot exceed 30 characters.");

        RuleFor(x => x.OwnershipType)
            .NotEmpty().WithMessage("Ownership Type is required.")
            .Must(t => AllowedOwnershipTypes.Contains(t, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Ownership Type must be Individual, Sole Proprietor, Partnership, or Company.");

        // Business Details Validation
        RuleFor(x => x.BusinessName)
            .NotEmpty().WithMessage("Business Name is required.")
            .MaximumLength(150).WithMessage("Business Name cannot exceed 150 characters.");

        RuleFor(x => x.BusinessType)
            .NotEmpty().WithMessage("Business Type is required.")
            .MaximumLength(50).WithMessage("Business Type cannot exceed 50 characters.");

        RuleFor(x => x.BusinessCategory)
            .NotEmpty().WithMessage("Business Category is required.")
            .MaximumLength(100).WithMessage("Business Category cannot exceed 100 characters.");

        RuleFor(x => x.BusinessRegistrationNumber)
            .MaximumLength(100).WithMessage("Business Registration Number cannot exceed 100 characters.");

        RuleFor(x => x.ContactPhone)
            .NotEmpty().WithMessage("Contact Phone is required.")
            .MaximumLength(30).WithMessage("Contact Phone cannot exceed 30 characters.");

        RuleFor(x => x.ContactEmail)
            .NotEmpty().WithMessage("Valid Contact Email is required.")
            .EmailAddress().WithMessage("A valid Contact Email address is required.")
            .MaximumLength(255).WithMessage("Contact Email cannot exceed 255 characters.");

        // Physical Location Validation
        RuleFor(x => x.AddressLine1)
            .NotEmpty().WithMessage("Address Line 1 is required.")
            .MaximumLength(255).WithMessage("Address Line 1 cannot exceed 255 characters.");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required.")
            .MaximumLength(100).WithMessage("City cannot exceed 100 characters.");

        RuleFor(x => x.District)
            .NotEmpty().WithMessage("District is required.")
            .MaximumLength(100).WithMessage("District cannot exceed 100 characters.");

        RuleFor(x => x.Province)
            .NotEmpty().WithMessage("Province is required.")
            .MaximumLength(100).WithMessage("Province cannot exceed 100 characters.");

        RuleFor(x => x.PostalCode)
            .NotEmpty().WithMessage("Postal Code is required.")
            .MaximumLength(20).WithMessage("Postal Code cannot exceed 20 characters.");

        // Verification Assets (Policy-based / Conditional — Validate lengths and formats when supplied)
        RuleFor(x => x.TaxIdentificationNumber)
            .MaximumLength(100).WithMessage("TIN Number cannot exceed 100 characters.");

        RuleFor(x => x.VatRegistrationNumber)
            .MaximumLength(100).WithMessage("VAT Registration Number cannot exceed 100 characters.");

        // Declarations Validation
        RuleFor(x => x.TermsAccepted)
            .Equal(true).WithMessage("You must accept the Terms and Conditions to submit a vendor application.");

        RuleFor(x => x.MarketplacePolicyAccepted)
            .Equal(true).WithMessage("You must accept the Marketplace Vendor Policy.");

        RuleFor(x => x.InformationAccuracyConfirmed)
            .Equal(true).WithMessage("You must confirm that all submitted information is accurate.");
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

        var normalizedContactEmail = request.ContactEmail.Trim().ToLowerInvariant();
        var normalizedOwnerEmail = request.OwnerEmail.Trim().ToLowerInvariant();

        if (user == null)
        {
            user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedContactEmail || u.Email.ToLower() == normalizedOwnerEmail, cancellationToken);
        }

        if (user == null)
        {
            // Establish pending applicant user record (zero password fields in application payload)
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = normalizedContactEmail,
                PasswordHash = string.Empty,
                FirstName = request.OwnerFullName.Trim(),
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

        // 3. Check duplicate business registration number (if provided)
        if (!string.IsNullOrWhiteSpace(request.BusinessRegistrationNumber))
        {
            var trimmedReg = request.BusinessRegistrationNumber.Trim();
            var duplicateReg = await _context.VendorApplications.AnyAsync(
                a => a.BusinessRegistrationNumber == trimmedReg && a.Status != "Rejected",
                cancellationToken);

            if (duplicateReg)
            {
                throw new InvalidOperationException($"A vendor application with Business Registration Number '{trimmedReg}' already exists.");
            }
        }

        // 4. Create structured VendorApplication record
        var application = new VendorApplication
        {
            Id = Guid.NewGuid(),
            ApplicantUserId = user.Id,

            // Owner & Identity (Private Verification Assets)
            OwnerFullName = request.OwnerFullName.Trim(),
            OwnerEmail = normalizedOwnerEmail,
            OwnerPhone = request.OwnerPhone.Trim(),
            OwnershipType = request.OwnershipType.Trim(),
            ResidentialAddress = request.ResidentialAddress?.Trim(),
            IdType = request.IdType?.Trim(),
            IdNumber = request.IdNumber?.Trim(),
            OwnerPhotoRef = request.OwnerPhotoRef?.Trim(),
            IdDocumentRef = request.IdDocumentRef?.Trim(),

            // Business & Tax Details
            BusinessName = request.BusinessName.Trim(),
            BusinessType = request.BusinessType.Trim(),
            BusinessCategory = request.BusinessCategory.Trim(),
            BusinessRegistrationNumber = request.BusinessRegistrationNumber?.Trim(),
            BusinessDescription = request.BusinessDescription?.Trim(),
            BusinessRegistrationDate = request.BusinessRegistrationDate,
            TaxIdentificationNumber = request.TaxIdentificationNumber?.Trim(),
            VatRegistrationNumber = request.VatRegistrationNumber?.Trim(),
            ContactPhone = request.ContactPhone.Trim(),
            ContactEmail = normalizedContactEmail,
            WebsiteUrl = request.WebsiteUrl?.Trim(),
            SocialMediaUrl = request.SocialMediaUrl?.Trim(),

            // Physical Store Location
            AddressLine1 = request.AddressLine1.Trim(),
            AddressLine2 = request.AddressLine2?.Trim(),
            City = request.City.Trim(),
            District = request.District.Trim(),
            Province = request.Province.Trim(),
            PostalCode = request.PostalCode.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,

            // Verification Documents (Private Verification Assets)
            BusinessRegistrationCertificateRef = request.BusinessRegistrationCertificateRef?.Trim(),
            TinCertificateRef = request.TinCertificateRef?.Trim(),
            TradeLicenceRef = request.TradeLicenceRef?.Trim(),
            OtherLicenceRef = request.OtherLicenceRef?.Trim(),

            // Store Profile Assets (Public Storefront)
            StoreFrontPhotoRef = request.StoreFrontPhotoRef?.Trim(),
            BusinessNameboardPhotoRef = request.BusinessNameboardPhotoRef?.Trim(),
            StoreInteriorPhotoRef = request.StoreInteriorPhotoRef?.Trim(),
            StoreLogoRef = request.StoreLogoRef?.Trim(),

            // Declarations & Audit
            TermsAccepted = request.TermsAccepted,
            MarketplacePolicyAccepted = request.MarketplacePolicyAccepted,
            InformationAccuracyConfirmed = request.InformationAccuracyConfirmed,
            TermsAcceptedAt = DateTime.UtcNow,

            // Status
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
