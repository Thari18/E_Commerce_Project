namespace LocalMart.Application.DTOs;

public record CategoryDto(Guid Id, string Name, string Slug, string ImageUrl);
public record ProductDto(Guid Id, string Name, string Slug, string Description, decimal Price, string VendorName, string ImageUrl, string Status);
public record SearchProductsResponseDto(List<ProductDto> Products, int TotalCount, int PageNumber, int PageSize);
