using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class OrderItem : BaseEntity<Guid>
{
    public Guid VendorOrderId { get; set; }
    public VendorOrder VendorOrder { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public string ProductName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
}
