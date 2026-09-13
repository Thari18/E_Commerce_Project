using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class ProductImage : BaseEntity<Guid>
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public string ImageUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; } = 0;
    public bool IsMain { get; set; } = false;
}
