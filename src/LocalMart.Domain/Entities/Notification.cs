using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class Notification : BaseEntity<Guid>
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "Info"; // Info, OrderStatus, System
    public bool IsRead { get; set; } = false;
}
