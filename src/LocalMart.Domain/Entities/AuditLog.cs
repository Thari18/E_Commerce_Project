using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class AuditLog : BaseEntity<Guid>
{
    public Guid ActorId { get; set; }
    public User Actor { get; set; } = null!;

    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? OldValuesJson { get; set; }
    public string? NewValuesJson { get; set; }
    public string IpAddress { get; set; } = string.Empty;
}
