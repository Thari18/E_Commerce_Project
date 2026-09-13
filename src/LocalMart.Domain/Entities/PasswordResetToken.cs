using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class PasswordResetToken : BaseEntity<Guid>
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string TokenHash { get; set; } = string.Empty;
    public string TokenType { get; set; } = "VendorActivation"; // "VendorActivation", "PasswordReset"
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; } = false;
    public DateTime? UsedAt { get; set; }
}
