using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class Coupon : BaseEntity<Guid>
{
    public string Code { get; set; } = string.Empty;
    public string DiscountType { get; set; } = "Percentage"; // Percentage, Fixed
    public decimal DiscountValue { get; set; }
    public decimal MinOrderAmount { get; set; } = 0;
    public decimal? MaxDiscountAmount { get; set; }
    public int MaxUses { get; set; } = 100;
    public int UsedCount { get; set; } = 0;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<CouponUsage> Usages { get; set; } = new List<CouponUsage>();
}
