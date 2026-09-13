namespace LocalMart.Application.DTOs;

public record SubmitVendorApplicationRequestDto(
    Guid? ApplicantUserId,

    // 1. Owner & Identity Details (Private Verification Assets)
    string OwnerFullName,
    string OwnerEmail,
    string OwnerPhone,
    string OwnershipType, // Individual, Partnership, Company
    string? ResidentialAddress = null,
    string? IdType = null, // NationalId, Passport, DrivingLicense
    string? IdNumber = null,
    string? OwnerPhotoRef = null, // Private verification asset
    string? IdDocumentRef = null, // Private verification asset

    // 2. Business & Tax Details
    string BusinessName = "",
    string BusinessType = "RetailShop", // RetailShop, Grocery, Bakery, Restaurant, Clothing, Electronics, Pharmacy, Other
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
    string? TinCertificateRef = null, // Document ref (distinct from TIN number)
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
);

public record VendorApplicationResponseDto(
    Guid ApplicationId,
    string Status,
    DateTime SubmittedAt,
    string Message
);

public record VendorApplicationStatusDto(
    Guid ApplicationId,
    string BusinessName,
    string Status,
    string? RejectionReason,
    DateTime SubmittedAt
);

public record VendorApplicationDetailDto(
    Guid Id,
    Guid ApplicantUserId,
    string ApplicantName,

    // Owner & Identity (Private Verification Assets)
    string OwnerFullName,
    string OwnerEmail,
    string OwnerPhone,
    string OwnershipType,
    string? ResidentialAddress,
    string? IdType,
    string? IdNumber,
    string? OwnerPhotoRef, // Private verification asset
    string? IdDocumentRef, // Private verification asset

    // Business & Tax Details
    string BusinessName,
    string BusinessType,
    string BusinessCategory,
    string? BusinessRegistrationNumber,
    string? BusinessDescription,
    DateTime? BusinessRegistrationDate,
    string? TaxIdentificationNumber,
    string? VatRegistrationNumber,
    string ContactPhone,
    string ContactEmail,
    string? WebsiteUrl,
    string? SocialMediaUrl,

    // Store Physical Location
    string AddressLine1,
    string? AddressLine2,
    string City,
    string District,
    string Province,
    string PostalCode,
    double? Latitude,
    double? Longitude,

    // Verification Documents (Private Verification Assets)
    string? BusinessRegistrationCertificateRef,
    string? TinCertificateRef,
    string? TradeLicenceRef,
    string? OtherLicenceRef,

    // Store Profile Assets (Public Storefront)
    string? StoreFrontPhotoRef,
    string? BusinessNameboardPhotoRef,
    string? StoreInteriorPhotoRef,
    string? StoreLogoRef,

    // Declarations & Audit
    bool TermsAccepted,
    bool MarketplacePolicyAccepted,
    bool InformationAccuracyConfirmed,
    DateTime? TermsAcceptedAt,

    // Moderation Status
    string Status,
    string? RejectionReason,
    Guid? ReviewedByAdminId,
    DateTime SubmittedAt,
    DateTime? ReviewedAt
);

public record ApproveVendorApplicationRequestDto(
    decimal CommissionRate = 10.00m
);

public record ApproveVendorApplicationResponseDto(
    Guid ApplicationId,
    Guid VendorId,
    string Status,
    string Message
);

public record RejectVendorApplicationRequestDto(
    string RejectionReason
);

public record RejectVendorApplicationResponseDto(
    Guid ApplicationId,
    string Status,
    string RejectionReason,
    string Message
);
