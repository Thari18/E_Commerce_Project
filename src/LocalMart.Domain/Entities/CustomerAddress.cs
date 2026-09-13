using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class CustomerAddress : BaseEntity<Guid>
{
    public Guid CustomerId { get; set; }
    public User Customer { get; set; } = null!;

    public string Title { get; set; } = string.Empty; // Home, Work, etc.
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public bool IsDefault { get; set; } = false;
}
