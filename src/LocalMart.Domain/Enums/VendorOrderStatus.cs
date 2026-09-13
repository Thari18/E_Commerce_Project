namespace LocalMart.Domain.Enums;

public enum VendorOrderStatus
{
    Pending = 1,
    Confirmed = 2,
    Preparing = 3,
    ReadyForPickup = 4,
    PickedUp = 5,
    OutForDelivery = 6,
    Delivered = 7,
    Cancelled = 8,
    Rejected = 9,
    FailedDelivery = 10,
    Refunded = 11
}
