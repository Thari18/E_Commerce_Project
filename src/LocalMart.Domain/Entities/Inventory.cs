using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class Inventory : BaseEntity<Guid>
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int QuantityAvailable { get; set; } = 0;
    public int QuantityReserved { get; set; } = 0;
    public int LowStockThreshold { get; set; } = 5;

    public ICollection<InventoryLog> InventoryLogs { get; set; } = new List<InventoryLog>();
}
