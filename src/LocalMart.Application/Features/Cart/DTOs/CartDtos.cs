namespace LocalMart.Application.Features.Cart.DTOs;

public record CartItemDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductSlug,
    string ProductImageUrl,
    string SKU,
    decimal UnitPrice,
    int Quantity,
    decimal TotalPrice,
    int QuantityAvailable,
    bool IsAvailable,
    Guid VendorId,
    string VendorStoreName
);

public record VendorGroupedCartDto(
    Guid VendorId,
    string VendorStoreName,
    List<CartItemDto> Items,
    decimal SubTotal
);

public record CartDto(
    Guid Id,
    Guid CustomerId,
    List<VendorGroupedCartDto> VendorGroups,
    int TotalItems,
    decimal SubTotal,
    decimal EstimatedDeliveryFee,
    decimal GrandTotal
);

public record AddToCartRequestDto(
    Guid ProductId,
    int Quantity = 1
);

public record UpdateCartItemRequestDto(
    int Quantity
);
