using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class VendorPayout : BaseEntity<Guid>
{
    public Guid VendorId { get; set; }
    public Vendor Vendor { get; set; } = null!;

    public decimal Amount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Processed, Failed
    public DateTime? PayoutDate { get; set; }
    public string? TransactionReference { get; set; }
}
