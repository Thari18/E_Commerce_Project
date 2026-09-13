using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class VendorCommission : BaseEntity<Guid>
{
    public Guid VendorOrderId { get; set; }
    public VendorOrder VendorOrder { get; set; } = null!;

    public decimal CommissionRate { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal NetEarnings { get; set; }
}
