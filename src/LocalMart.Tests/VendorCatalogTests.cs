using LocalMart.Application.DTOs;
using LocalMart.Application.Features.Products.Queries;
using LocalMart.Application.Features.VendorCatalog.Commands;
using LocalMart.Application.Features.VendorCatalog.Queries;
using LocalMart.Domain.Entities;
using LocalMart.Domain.Enums;
using LocalMart.Infrastructure.Identity;
using LocalMart.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LocalMart.Tests;

public class VendorCatalogTests
{
    private ApplicationDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"LocalMartCatalogTestDb_{Guid.NewGuid()}")
            .Options;

        var context = new ApplicationDbContext(options);
        return context;
    }

    [Fact]
    public async Task CreateProduct_WithApprovedVendor_Succeeds()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var user = new User { Id = Guid.NewGuid(), Email = "approved_vendor@example.com", FirstName = "App", LastName = "Vendor" };
        var vendor = new Vendor { Id = Guid.NewGuid(), UserId = user.Id, StoreName = "App Store", Status = "Approved" };
        var category = new Category { Id = Guid.NewGuid(), Name = "Groceries", Slug = "groceries" };

        context.Users.Add(user);
        context.Vendors.Add(vendor);
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        var handler = new CreateProductCommandHandler(context);
        var command = new CreateProductCommand(
            user.Id,
            category.Id,
            "Fresh Apples",
            "Crisp organic apples",
            "APP-001",
            3.99m,
            "Active",
            50,
            10,
            null
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Fresh Apples", result.Name);
        Assert.Equal("APP-001", result.Sku);
        Assert.Equal(50, result.QuantityAvailable);
        Assert.Equal("Active", result.Status);
    }

    [Fact]
    public async Task CreateProduct_WithPendingVendor_ThrowsUnauthorized()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var user = new User { Id = Guid.NewGuid(), Email = "pending_vendor@example.com", FirstName = "Pending", LastName = "Vendor" };
        var vendor = new Vendor { Id = Guid.NewGuid(), UserId = user.Id, StoreName = "Pending Store", Status = "Pending" };
        var category = new Category { Id = Guid.NewGuid(), Name = "Groceries", Slug = "groceries" };

        context.Users.Add(user);
        context.Vendors.Add(vendor);
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        var handler = new CreateProductCommandHandler(context);
        var command = new CreateProductCommand(
            user.Id,
            category.Id,
            "Fresh Bananas",
            "Sweet yellow bananas",
            "BAN-001",
            1.99m,
            "Active",
            20,
            5,
            null
        );

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateProduct_ByDifferentVendor_ThrowsUnauthorized()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var userA = new User { Id = Guid.NewGuid(), Email = "vendor_a@example.com", FirstName = "Vendor", LastName = "A" };
        var vendorA = new Vendor { Id = Guid.NewGuid(), UserId = userA.Id, StoreName = "Store A", Status = "Approved" };

        var userB = new User { Id = Guid.NewGuid(), Email = "vendor_b@example.com", FirstName = "Vendor", LastName = "B" };
        var vendorB = new Vendor { Id = Guid.NewGuid(), UserId = userB.Id, StoreName = "Store B", Status = "Approved" };

        var category = new Category { Id = Guid.NewGuid(), Name = "Produce", Slug = "produce" };
        var productA = new Product
        {
            Id = Guid.NewGuid(),
            VendorId = vendorA.Id,
            CategoryId = category.Id,
            Name = "Vendor A Apples",
            Slug = "vendor-a-apples",
            Description = "Apples",
            SKU = "VA-APP-01",
            Price = 2.50m,
            Status = ProductStatus.Active
        };

        context.Users.AddRange(userA, userB);
        context.Vendors.AddRange(vendorA, vendorB);
        context.Categories.Add(category);
        context.Products.Add(productA);
        await context.SaveChangesAsync();

        var handler = new UpdateProductCommandHandler(context);
        var command = new UpdateProductCommand(
            userB.Id, // Vendor B attempting to edit Vendor A's product!
            productA.Id,
            category.Id,
            "Hacked Apples",
            "Hacked description",
            "VA-APP-01",
            0.01m
        );

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateInventory_UpdatesStockAndAutoAdjustsStatus_ActiveAndOutOfStockOnly()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var user = new User { Id = Guid.NewGuid(), Email = "inventory_vendor@example.com", FirstName = "Stock", LastName = "Vendor" };
        var vendor = new Vendor { Id = Guid.NewGuid(), UserId = user.Id, StoreName = "Stock Store", Status = "Approved" };
        var category = new Category { Id = Guid.NewGuid(), Name = "Produce", Slug = "produce" };

        var product = new Product
        {
            Id = Guid.NewGuid(),
            VendorId = vendor.Id,
            CategoryId = category.Id,
            Name = "Stock Milk",
            Slug = "stock-milk",
            Description = "Whole milk",
            SKU = "STK-MILK-01",
            Price = 3.50m,
            Status = ProductStatus.Active
        };

        var inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            ProductId = product.Id,
            QuantityAvailable = 10,
            QuantityReserved = 2
        };

        context.Users.Add(user);
        context.Vendors.Add(vendor);
        context.Categories.Add(category);
        context.Products.Add(product);
        context.Inventories.Add(inventory);
        await context.SaveChangesAsync();

        var handler = new UpdateInventoryCommandHandler(context);

        // 1. Reduce inventory to 0 -> should auto-transition to OutOfStock
        var resultZero = await handler.Handle(new UpdateInventoryCommand(user.Id, product.Id, 0), CancellationToken.None);

        Assert.Equal(0, resultZero.QuantityAvailable);
        Assert.Equal(2, resultZero.QuantityReserved);

        var updatedProd1 = await context.Products.FindAsync(product.Id);
        Assert.Equal(ProductStatus.OutOfStock, updatedProd1!.Status);

        // 2. Replenish inventory to 25 -> should auto-transition back to Active
        var resultReplenished = await handler.Handle(new UpdateInventoryCommand(user.Id, product.Id, 25), CancellationToken.None);

        Assert.Equal(25, resultReplenished.QuantityAvailable);

        var updatedProd2 = await context.Products.FindAsync(product.Id);
        Assert.Equal(ProductStatus.Active, updatedProd2!.Status);
    }

    [Fact]
    public async Task UpdateInventory_DoesNotAutoActivate_Draft_Inactive_Or_Suspended()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var user = new User { Id = Guid.NewGuid(), Email = "vendor_auto@example.com", FirstName = "Auto", LastName = "Vendor" };
        var vendor = new Vendor { Id = Guid.NewGuid(), UserId = user.Id, StoreName = "Auto Store", Status = "Approved" };
        var category = new Category { Id = Guid.NewGuid(), Name = "Bakery", Slug = "bakery" };

        var prodDraft = new Product { Id = Guid.NewGuid(), VendorId = vendor.Id, CategoryId = category.Id, Name = "Draft Bread", Slug = "draft-bread", SKU = "DFT-01", Status = ProductStatus.Draft };
        var invDraft = new Inventory { Id = Guid.NewGuid(), ProductId = prodDraft.Id, QuantityAvailable = 0 };

        var prodInactive = new Product { Id = Guid.NewGuid(), VendorId = vendor.Id, CategoryId = category.Id, Name = "Inactive Cake", Slug = "inactive-cake", SKU = "INA-02", Status = ProductStatus.Inactive };
        var invInactive = new Inventory { Id = Guid.NewGuid(), ProductId = prodInactive.Id, QuantityAvailable = 0 };

        var prodSuspended = new Product { Id = Guid.NewGuid(), VendorId = vendor.Id, CategoryId = category.Id, Name = "Suspended Pie", Slug = "suspended-pie", SKU = "SUS-03", Status = ProductStatus.Suspended };
        var invSuspended = new Inventory { Id = Guid.NewGuid(), ProductId = prodSuspended.Id, QuantityAvailable = 0 };

        context.Users.Add(user);
        context.Vendors.Add(vendor);
        context.Categories.Add(category);
        context.Products.AddRange(prodDraft, prodInactive, prodSuspended);
        context.Inventories.AddRange(invDraft, invInactive, invSuspended);
        await context.SaveChangesAsync();

        var handler = new UpdateInventoryCommandHandler(context);

        // Act & Assert 1: Replenish Draft -> remains Draft
        await handler.Handle(new UpdateInventoryCommand(user.Id, prodDraft.Id, 50), CancellationToken.None);
        var resDraft = await context.Products.FindAsync(prodDraft.Id);
        Assert.Equal(ProductStatus.Draft, resDraft!.Status);

        // Act & Assert 2: Replenish Inactive -> remains Inactive
        await handler.Handle(new UpdateInventoryCommand(user.Id, prodInactive.Id, 50), CancellationToken.None);
        var resInactive = await context.Products.FindAsync(prodInactive.Id);
        Assert.Equal(ProductStatus.Inactive, resInactive!.Status);

        // Act & Assert 3: Replenish Suspended -> remains Suspended
        await handler.Handle(new UpdateInventoryCommand(user.Id, prodSuspended.Id, 50), CancellationToken.None);
        var resSuspended = await context.Products.FindAsync(prodSuspended.Id);
        Assert.Equal(ProductStatus.Suspended, resSuspended!.Status);
    }

    [Fact]
    public async Task PublicProductSearch_EnforcesApprovedVendor_ActiveStatus_AndPositiveStock()
    {
        // Arrange
        var context = GetInMemoryDbContext();

        var vendorApproved = new Vendor { Id = Guid.NewGuid(), StoreName = "Approved Vendor", Status = "Approved" };
        var vendorPending = new Vendor { Id = Guid.NewGuid(), StoreName = "Pending Vendor", Status = "Pending" };

        var category = new Category { Id = Guid.NewGuid(), Name = "Category 1", Slug = "cat-1" };

        // Product 1: Approved Vendor + Active + Stock > 0 => VISIBLE
        var prod1 = new Product { Id = Guid.NewGuid(), VendorId = vendorApproved.Id, CategoryId = category.Id, Name = "Visible Product", Slug = "visible-prod", SKU = "V-001", Status = ProductStatus.Active };
        var inv1 = new Inventory { Id = Guid.NewGuid(), ProductId = prod1.Id, QuantityAvailable = 10 };

        // Product 2: Approved Vendor + OutOfStock => HIDDEN
        var prod2 = new Product { Id = Guid.NewGuid(), VendorId = vendorApproved.Id, CategoryId = category.Id, Name = "Out of Stock Product", Slug = "oos-prod", SKU = "OOS-002", Status = ProductStatus.OutOfStock };
        var inv2 = new Inventory { Id = Guid.NewGuid(), ProductId = prod2.Id, QuantityAvailable = 0 };

        // Product 3: Approved Vendor + Draft => HIDDEN
        var prod3 = new Product { Id = Guid.NewGuid(), VendorId = vendorApproved.Id, CategoryId = category.Id, Name = "Draft Product", Slug = "draft-prod", SKU = "DFT-003", Status = ProductStatus.Draft };
        var inv3 = new Inventory { Id = Guid.NewGuid(), ProductId = prod3.Id, QuantityAvailable = 100 };

        // Product 4: Pending Vendor + Active + Stock > 0 => HIDDEN (Vendor not approved)
        var prod4 = new Product { Id = Guid.NewGuid(), VendorId = vendorPending.Id, CategoryId = category.Id, Name = "Pending Vendor Product", Slug = "pending-v-prod", SKU = "PV-004", Status = ProductStatus.Active };
        var inv4 = new Inventory { Id = Guid.NewGuid(), ProductId = prod4.Id, QuantityAvailable = 50 };

        context.Vendors.AddRange(vendorApproved, vendorPending);
        context.Categories.Add(category);
        context.Products.AddRange(prod1, prod2, prod3, prod4);
        context.Inventories.AddRange(inv1, inv2, inv3, inv4);
        await context.SaveChangesAsync();

        var queryHandler = new GetProductsQueryHandler(context);

        // Act
        var result = await queryHandler.Handle(new GetProductsQuery(), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Single(result.Products);
        Assert.Equal("Visible Product", result.Products.First().Name);
    }

    [Fact]
    public async Task PublicProductDetail_RejectsNonVisibleProducts_WithKeyNotFoundException()
    {
        // Arrange
        var context = GetInMemoryDbContext();

        var vendorApproved = new Vendor { Id = Guid.NewGuid(), StoreName = "Approved Vendor", Status = "Approved" };
        var vendorPending = new Vendor { Id = Guid.NewGuid(), StoreName = "Pending Vendor", Status = "Pending" };
        var category = new Category { Id = Guid.NewGuid(), Name = "Category 1", Slug = "cat-1" };

        var prodVisible = new Product { Id = Guid.NewGuid(), VendorId = vendorApproved.Id, CategoryId = category.Id, Name = "Visible Product", Slug = "visible-slug", SKU = "V-001", Status = ProductStatus.Active };
        var invVisible = new Inventory { Id = Guid.NewGuid(), ProductId = prodVisible.Id, QuantityAvailable = 10 };

        var prodOos = new Product { Id = Guid.NewGuid(), VendorId = vendorApproved.Id, CategoryId = category.Id, Name = "OOS Product", Slug = "oos-slug", SKU = "OOS-002", Status = ProductStatus.OutOfStock };
        var invOos = new Inventory { Id = Guid.NewGuid(), ProductId = prodOos.Id, QuantityAvailable = 0 };

        var prodDraft = new Product { Id = Guid.NewGuid(), VendorId = vendorApproved.Id, CategoryId = category.Id, Name = "Draft Product", Slug = "draft-slug", SKU = "DFT-003", Status = ProductStatus.Draft };
        var invDraft = new Inventory { Id = Guid.NewGuid(), ProductId = prodDraft.Id, QuantityAvailable = 20 };

        var prodInactive = new Product { Id = Guid.NewGuid(), VendorId = vendorApproved.Id, CategoryId = category.Id, Name = "Inactive Product", Slug = "inactive-slug", SKU = "INA-004", Status = ProductStatus.Inactive };
        var invInactive = new Inventory { Id = Guid.NewGuid(), ProductId = prodInactive.Id, QuantityAvailable = 20 };

        var prodSuspended = new Product { Id = Guid.NewGuid(), VendorId = vendorApproved.Id, CategoryId = category.Id, Name = "Suspended Product", Slug = "suspended-slug", SKU = "SUS-005", Status = ProductStatus.Suspended };
        var invSuspended = new Inventory { Id = Guid.NewGuid(), ProductId = prodSuspended.Id, QuantityAvailable = 20 };

        var prodPendingVendor = new Product { Id = Guid.NewGuid(), VendorId = vendorPending.Id, CategoryId = category.Id, Name = "Pending Vendor Prod", Slug = "pv-slug", SKU = "PV-006", Status = ProductStatus.Active };
        var invPendingVendor = new Inventory { Id = Guid.NewGuid(), ProductId = prodPendingVendor.Id, QuantityAvailable = 20 };

        context.Vendors.AddRange(vendorApproved, vendorPending);
        context.Categories.Add(category);
        context.Products.AddRange(prodVisible, prodOos, prodDraft, prodInactive, prodSuspended, prodPendingVendor);
        context.Inventories.AddRange(invVisible, invOos, invDraft, invInactive, invSuspended, invPendingVendor);
        await context.SaveChangesAsync();

        var handler = new GetProductDetailQueryHandler(context);

        // 1. Visible Product -> SUCCEEDS
        var detailRes = await handler.Handle(new GetProductDetailQuery(prodVisible.Id.ToString()), CancellationToken.None);
        Assert.NotNull(detailRes);
        Assert.Equal("Visible Product", detailRes.Name);

        // 2. OutOfStock Product -> REJECTED (404)
        await Assert.ThrowsAsync<KeyNotFoundException>(() => handler.Handle(new GetProductDetailQuery(prodOos.Id.ToString()), CancellationToken.None));

        // 3. Draft Product -> REJECTED (404)
        await Assert.ThrowsAsync<KeyNotFoundException>(() => handler.Handle(new GetProductDetailQuery(prodDraft.Id.ToString()), CancellationToken.None));

        // 4. Inactive Product -> REJECTED (404)
        await Assert.ThrowsAsync<KeyNotFoundException>(() => handler.Handle(new GetProductDetailQuery(prodInactive.Id.ToString()), CancellationToken.None));

        // 5. Suspended Product -> REJECTED (404)
        await Assert.ThrowsAsync<KeyNotFoundException>(() => handler.Handle(new GetProductDetailQuery(prodSuspended.Id.ToString()), CancellationToken.None));

        // 6. Pending Vendor Product -> REJECTED (404)
        await Assert.ThrowsAsync<KeyNotFoundException>(() => handler.Handle(new GetProductDetailQuery(prodPendingVendor.Id.ToString()), CancellationToken.None));
    }
}
