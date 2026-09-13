using LocalMart.Domain.Common;

namespace LocalMart.Domain.Entities;

public class PaymentTransaction : BaseEntity<Guid>
{
    public Guid PaymentId { get; set; }
    public Payment Payment { get; set; } = null!;

    public string TransactionType { get; set; } = string.Empty; // SessionInit, Webhook, Refund
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = "{}";
}
