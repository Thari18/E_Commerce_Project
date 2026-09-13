using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class VendorApplication : BaseEntity<Guid>
{
    public Guid ApplicantUserId { get; set; }
    public User ApplicantUser { get; set; } = null!;

    public string BusinessName { get; set; } = string.Empty;
    public string BusinessRegistrationNumber { get; set; } = string.Empty;
    public string? TaxIdentificationNumber { get; set; }
    public string ContactPhone { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;

    public string Status { get; set; } = "Pending"; // Pending, UnderReview, Approved, Rejected
    public string? RejectionReason { get; set; }

    public Guid? ReviewedByAdminId { get; set; }
    public User? ReviewedByAdmin { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
}
