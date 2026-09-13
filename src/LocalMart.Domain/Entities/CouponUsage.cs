using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class CouponUsage : BaseEntity<Guid>
{
    public Guid CouponId { get; set; }
    public Coupon Coupon { get; set; } = null!;

    public Guid CustomerId { get; set; }
    public User Customer { get; set; } = null!;

    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public decimal DiscountApplied { get; set; }
    public DateTime UsedAt { get; set; } = DateTime.UtcNow;
}
