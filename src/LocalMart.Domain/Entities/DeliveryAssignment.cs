using LocalMart.Domain.Common;
using LocalMart.Domain.Enums;

namespace LocalMart.Domain.Entities;

public class DeliveryAssignment : BaseEntity<Guid>
{
    public Guid VendorOrderId { get; set; }
    public VendorOrder VendorOrder { get; set; } = null!;

    public Guid DeliveryStaffId { get; set; }
    public User DeliveryStaff { get; set; } = null!;

    public DeliveryStatus Status { get; set; } = DeliveryStatus.Ready;
    public DateTime? AssignedAt { get; set; }
    public DateTime? PickedUpAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
}
