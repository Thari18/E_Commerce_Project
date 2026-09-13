using FluentValidation;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using LocalMart.Domain.Entities;
using LocalMart.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.VendorCatalog.Commands;

public record CreateProductCommand(
    Guid UserId,
    Guid CategoryId,
    string Name,
    string Description,
    string Sku,
    decimal Price,
    string Status,
    int InitialQuantity,
    int LowStockThreshold,
    List<CreateProductImageDto>? ImageUrls
) : IRequest<CreateProductResponseDto>;

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.Sku).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.InitialQuantity).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Status).Must(s => Enum.TryParse<ProductStatus>(s, true, out _))
            .WithMessage("Invalid status. Allowed values: Draft, Active, Inactive, OutOfStock, Suspended");
    }
}

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, CreateProductResponseDto>
{
    private readonly IApplicationDbContext _context;

    public CreateProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CreateProductResponseDto> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify User exists and has an Approved Vendor record
        var vendor = await _context.Vendors
            .FirstOrDefaultAsync(v => v.UserId == request.UserId, cancellationToken);

        if (vendor == null)
        {
            throw new UnauthorizedAccessException("User is not registered as a Vendor.");
        }

        if (!string.Equals(vendor.Status, "Approved", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Only approved vendors are permitted to manage catalog products.");
        }

        // 2. Verify Category exists
        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == request.CategoryId, cancellationToken);

        if (!categoryExists)
        {
            throw new KeyNotFoundException($"Category with ID '{request.CategoryId}' does not exist.");
        }

        // 3. Verify SKU uniqueness
        var skuExists = await _context.Products
            .AnyAsync(p => p.SKU.ToLower() == request.Sku.Trim().ToLower(), cancellationToken);

        if (skuExists)
        {
            throw new InvalidOperationException($"Product with SKU '{request.Sku}' already exists.");
        }

        // 4. Parse ProductStatus enum
        if (!Enum.TryParse<ProductStatus>(request.Status, true, out var parsedStatus))
        {
            parsedStatus = ProductStatus.Draft;
        }

        // Auto transition to OutOfStock if InitialQuantity is 0 and status was requested Active
        if (request.InitialQuantity <= 0 && parsedStatus == ProductStatus.Active)
        {
            parsedStatus = ProductStatus.OutOfStock;
        }

        var productId = Guid.NewGuid();
        var slug = GenerateSlug(request.Name);

        var product = new Product
        {
            Id = productId,
            VendorId = vendor.Id,
            CategoryId = request.CategoryId,
            Name = request.Name.Trim(),
            Slug = slug,
            Description = request.Description.Trim(),
            SKU = request.Sku.Trim().ToUpper(),
            Price = request.Price,
            Status = parsedStatus,
            CreatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);

        // 5. Add Product Images
        if (request.ImageUrls != null && request.ImageUrls.Any())
        {
            foreach (var img in request.ImageUrls)
            {
                _context.ProductImages.Add(new ProductImage
                {
                    Id = Guid.NewGuid(),
                    ProductId = productId,
                    ImageUrl = img.ImageUrl,
                    IsMain = img.IsPrimary
                });
            }
        }
        else
        {
            // Default placeholder image if none provided
            _context.ProductImages.Add(new ProductImage
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                ImageUrl = "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80",
                IsMain = true
            });
        }

        // 6. Create Initial Inventory Record
        var inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            QuantityAvailable = request.InitialQuantity,
            QuantityReserved = 0,
            LowStockThreshold = request.LowStockThreshold,
            CreatedAt = DateTime.UtcNow
        };

        _context.Inventories.Add(inventory);

        await _context.SaveChangesAsync(cancellationToken);

        return new CreateProductResponseDto(
            product.Id,
            product.Name,
            product.SKU,
            product.Price,
            product.Status.ToString(),
            inventory.QuantityAvailable,
            product.CreatedAt,
            "Product created successfully."
        );
    }

    private static string GenerateSlug(string name)
    {
        var slug = name.Trim().ToLower().Replace(" ", "-");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-+", "-").Trim('-');
        return $"{slug}-{Guid.NewGuid().ToString()[..6]}";
    }
}
