using LocalMart.Domain.Common;
using LocalMart.Domain.Enums;

namespace LocalMart.Domain.Entities;

public class Order : BaseEntity<Guid>
{
    public Guid CustomerId { get; set; }
    public User Customer { get; set; } = null!;

    public string OrderNumber { get; set; } = string.Empty;

    public Guid ShippingAddressId { get; set; }
    public CustomerAddress ShippingAddress { get; set; } = null!;

    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal GrandTotal { get; set; }

    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.COD;

    public ICollection<VendorOrder> VendorOrders { get; set; } = new List<VendorOrder>();
    public Payment? Payment { get; set; }
}
