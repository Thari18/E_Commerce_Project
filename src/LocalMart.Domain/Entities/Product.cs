using LocalMart.Domain.Common;
using LocalMart.Domain.Enums;

namespace LocalMart.Domain.Entities;

public class Product : BaseEntity<Guid>
{
    public Guid VendorId { get; set; }
    public Vendor Vendor { get; set; } = null!;

    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string SKU { get; set; } = string.Empty;
    public ProductStatus Status { get; set; } = ProductStatus.Draft;

    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public Inventory? Inventory { get; set; }
}
