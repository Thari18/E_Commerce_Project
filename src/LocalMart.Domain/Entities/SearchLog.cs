using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class SearchLog : BaseEntity<Guid>
{
    public Guid? CustomerId { get; set; }
    public User? Customer { get; set; }

    public string SearchQuery { get; set; } = string.Empty;
    public string? FiltersJson { get; set; }
    public int ResultCount { get; set; } = 0;
}
