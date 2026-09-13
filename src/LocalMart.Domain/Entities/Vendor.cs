using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class Vendor : BaseEntity<Guid>
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid ApplicationId { get; set; }
    public VendorApplication Application { get; set; } = null!;

    public string StoreName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string BannerUrl { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double ServiceRadiusKm { get; set; } = 10.0;
    public string Status { get; set; } = "Approved"; // Approved, Suspended, Inactive
    public decimal CommissionRate { get; set; } = 10.00m;

    public ICollection<Product> Products { get; set; } = new List<Product>();
}
