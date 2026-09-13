namespace LocalMart.Application.DTOs;

public record CreateProductRequestDto(
    Guid CategoryId,
    string Name,
    string Description,
    string Sku,
    decimal Price,
    string Status, // Draft, Active, Inactive, OutOfStock, Suspended
    int InitialQuantity,
    int LowStockThreshold,
    List<CreateProductImageDto>? ImageUrls
);

public record CreateProductImageDto(
    string ImageUrl,
    bool IsPrimary
);

public record CreateProductResponseDto(
    Guid ProductId,
    string Name,
    string Sku,
    decimal Price,
    string Status,
    int QuantityAvailable,
    DateTime CreatedAt,
    string Message
);

public record UpdateProductRequestDto(
    Guid CategoryId,
    string Name,
    string Description,
    string Sku,
    decimal Price
);

public record UpdateProductStatusRequestDto(
    string Status // Draft, Active, Inactive, OutOfStock, Suspended
);

public record UpdateInventoryRequestDto(
    int QuantityAvailable
);

public record UpdateInventoryResponseDto(
    Guid ProductId,
    int QuantityAvailable,
    int QuantityReserved,
    DateTime UpdatedAt,
    string Message
);

public record VendorProductItemDto(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string Name,
    string Slug,
    string Description,
    string Sku,
    decimal Price,
    string Status,
    string? PrimaryImageUrl,
    int QuantityAvailable,
    int QuantityReserved,
    DateTime CreatedAt
);

public record VendorInventoryItemDto(
    Guid InventoryId,
    Guid ProductId,
    string ProductName,
    string ProductSku,
    string ProductStatus,
    int QuantityAvailable,
    int QuantityReserved,
    int TotalPhysicalStock,
    DateTime LastUpdated
);

public record ProductDetailDto(
    Guid Id,
    Guid VendorId,
    string VendorBusinessName,
    Guid CategoryId,
    string CategoryName,
    string Name,
    string Slug,
    string Description,
    string Sku,
    decimal Price,
    string Status,
    List<string> ImageUrls,
    int QuantityAvailable,
    bool InStock,
    DateTime CreatedAt
);

public record VendorProductsResponseDto(
    List<VendorProductItemDto> Products,
    int TotalCount,
    int PageNumber,
    int PageSize
);
