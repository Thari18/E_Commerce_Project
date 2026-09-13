using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class VendorApplication : BaseEntity<Guid>
{
    public Guid ApplicantUserId { get; set; }
    public User ApplicantUser { get; set; } = null!;

    // 1. Owner & Identity Details (Private Verification Assets)
    public string OwnerFullName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string OwnerPhone { get; set; } = string.Empty;
    public string OwnershipType { get; set; } = "Individual"; // Individual / Sole Proprietor, Partnership, Company
    public string? ResidentialAddress { get; set; }
    public string? IdType { get; set; } // NationalId, Passport, DrivingLicense
    public string? IdNumber { get; set; }
    public string? OwnerPhotoRef { get; set; } // Private verification asset — NEVER exposed publicly
    public string? IdDocumentRef { get; set; } // Private verification asset

    // 2. Business & Tax Details
    public string BusinessName { get; set; } = string.Empty;
    public string BusinessType { get; set; } = "RetailShop"; // RetailShop, Grocery, Bakery, Restaurant, Clothing, Electronics, Pharmacy, Other
    public string BusinessCategory { get; set; } = string.Empty;
    public string? BusinessRegistrationNumber { get; set; } // Nullable to avoid universal mandatory constraint
    public string? BusinessDescription { get; set; }
    public DateTime? BusinessRegistrationDate { get; set; }
    public string? TaxIdentificationNumber { get; set; } // TIN Number
    public string? VatRegistrationNumber { get; set; } // VAT Number (distinct from TIN)
    public string ContactPhone { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string? WebsiteUrl { get; set; }
    public string? SocialMediaUrl { get; set; }

    // 3. Store Physical Location
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // 4. Verification Documents (Private Verification Assets — Conditional based on policy)
    public string? BusinessRegistrationCertificateRef { get; set; }
    public string? TinCertificateRef { get; set; } // Document reference (distinct from TIN number)
    public string? TradeLicenceRef { get; set; }
    public string? OtherLicenceRef { get; set; }

    // 5. Store Profile Assets (Public Storefront Assets)
    public string? StoreFrontPhotoRef { get; set; }
    public string? BusinessNameboardPhotoRef { get; set; }
    public string? StoreInteriorPhotoRef { get; set; }
    public string? StoreLogoRef { get; set; }

    // 6. Declarations & Audit
    public bool TermsAccepted { get; set; }
    public bool MarketplacePolicyAccepted { get; set; }
    public bool InformationAccuracyConfirmed { get; set; }
    public DateTime? TermsAcceptedAt { get; set; }

    // 7. Application Status & Moderation
    public string Status { get; set; } = "Pending"; // Pending, UnderReview, Approved, Rejected
    public string? RejectionReason { get; set; }

    public Guid? ReviewedByAdminId { get; set; }
    public User? ReviewedByAdmin { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
}
