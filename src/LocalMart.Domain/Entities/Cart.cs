using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class Cart : BaseEntity<Guid>
{
    public Guid CustomerId { get; set; }
    public User Customer { get; set; } = null!;

    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}
