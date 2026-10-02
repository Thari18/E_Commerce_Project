namespace LocalMart.Application.Features.Orders.DTOs;

public record ValidateCheckoutRequestDto(
    Guid ShippingAddressId,
    string? CouponCode = null
);

public record CustomerAddressDto(
    Guid Id,
    string Title,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode
);

public record CheckoutItemValidationDto(
    Guid ProductId,
    string ProductName,
    string SKU,
    decimal UnitPrice,
    int Quantity,
    decimal TotalPrice,
    int QuantityAvailable,
    bool IsAvailable
);

public record VendorGroupedCheckoutDto(
    Guid VendorId,
    string VendorStoreName,
    decimal CommissionRate,
    decimal SubTotal,
    List<CheckoutItemValidationDto> Items
);

public record CheckoutValidationResultDto(
    bool IsValid,
    List<string> Errors,
    Guid CartId,
    Guid ShippingAddressId,
    CustomerAddressDto? ShippingAddress,
    decimal SubTotal,
    decimal DiscountAmount,
    decimal DeliveryFee,
    decimal GrandTotal,
    string? CouponCode,
    List<VendorGroupedCheckoutDto> VendorGroups
);

public record CreateOrderRequestDto(
    Guid ShippingAddressId,
    string PaymentMethod,
    string? CouponCode = null
);

public record OrderItemDto(
    Guid Id,
    Guid VendorOrderId,
    Guid ProductId,
    string ProductName,
    decimal UnitPrice,
    int Quantity,
    decimal TotalPrice
);

public record VendorOrderDto(
    Guid Id,
    Guid ParentOrderId,
    Guid VendorId,
    string VendorStoreName,
    string SubOrderNumber,
    decimal SubTotal,
    decimal CommissionRate,
    decimal CommissionAmount,
    decimal NetEarnings,
    string Status,
    List<OrderItemDto> Items
);

public record PaymentDto(
    Guid Id,
    Guid OrderId,
    decimal Amount,
    string PaymentMethod,
    string PaymentStatus,
    string? GatewayTransactionId
);

public record OrderDto(
    Guid Id,
    Guid CustomerId,
    string OrderNumber,
    Guid ShippingAddressId,
    CustomerAddressDto? ShippingAddress,
    decimal SubTotal,
    decimal DiscountAmount,
    decimal DeliveryFee,
    decimal GrandTotal,
    string PaymentStatus,
    string PaymentMethod,
    DateTime CreatedAt,
    List<VendorOrderDto> VendorOrders,
    PaymentDto? Payment
);
