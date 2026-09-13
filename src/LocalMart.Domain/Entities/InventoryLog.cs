using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class InventoryLog : BaseEntity<Guid>
{
    public Guid InventoryId { get; set; }
    public Inventory Inventory { get; set; } = null!;

    public int ChangeQuantity { get; set; }
    public int PreviousQuantity { get; set; }
    public int NewQuantity { get; set; }
    public string Reason { get; set; } = string.Empty;
}
