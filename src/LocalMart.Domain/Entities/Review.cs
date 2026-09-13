using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class Review : BaseEntity<Guid>
{
    public Guid CustomerId { get; set; }
    public User Customer { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid VendorId { get; set; }
    public Vendor Vendor { get; set; } = null!;

    public Guid OrderItemId { get; set; }
    public OrderItem OrderItem { get; set; } = null!;

    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
}
