using LocalMart.Domain.Common;
using LocalMart.Domain.Enums;

namespace LocalMart.Domain.Entities;

public class VendorOrder : BaseEntity<Guid>
{
    public Guid ParentOrderId { get; set; }
    public Order ParentOrder { get; set; } = null!;

    public Guid VendorId { get; set; }
    public Vendor Vendor { get; set; } = null!;

    public string SubOrderNumber { get; set; } = string.Empty;
    public decimal SubTotal { get; set; }
    public decimal CommissionRate { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal NetEarnings { get; set; }

    public VendorOrderStatus Status { get; set; } = VendorOrderStatus.Pending;

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public DeliveryAssignment? DeliveryAssignment { get; set; }
}
