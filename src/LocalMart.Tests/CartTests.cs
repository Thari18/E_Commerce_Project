using LocalMart.Application.Common.Models;
using LocalMart.Application.Features.Cart.Commands;
using LocalMart.Application.Features.Cart.Queries;
using LocalMart.Domain.Entities;
using LocalMart.Domain.Enums;
using LocalMart.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using MediatR;
using Xunit;

namespace LocalMart.Tests;

public class CartTests
{
    private ApplicationDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"LocalMartCartTestDb_{Guid.NewGuid()}")
            .Options;

        return new ApplicationDbContext(options);
    }

    private IOptions<MarketplaceOptions> GetDefaultMarketplaceOptions()
    {
        return Options.Create(new MarketplaceOptions { FlatDeliveryFee = 5.00m });
    }

    [Fact]
    public async Task GetCartQuery_WhenCartIsEmpty_ReturnsEmptyCartDto()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var customerId = Guid.NewGuid();
        var handler = new GetCartQueryHandler(context, GetDefaultMarketplaceOptions());
        var query = new GetCartQuery(customerId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(customerId, result.CustomerId);
        Assert.Empty(result.VendorGroups);
        Assert.Equal(0, result.TotalItems);
        Assert.Equal(0m, result.SubTotal);
        Assert.Equal(0m, result.EstimatedDeliveryFee);
        Assert.Equal(0m, result.GrandTotal);
    }

    [Fact]
    public async Task AddToCartCommand_WithValidStock_AddsItemAndSnapshotsUnitPrice()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var customerId = Guid.NewGuid();
        var vendorUser = new User { Id = Guid.NewGuid(), Email = "vendor1@test.com", FirstName = "Vendor", LastName = "One" };
        var vendor = new Vendor { Id = Guid.NewGuid(), UserId = vendorUser.Id, StoreName = "Dairy Fresh", Status = "Approved" };
        var category = new Category { Id = Guid.NewGuid(), Name = "Dairy", Slug = "dairy" };
        var product = new Product
        {
            Id = Guid.NewGuid(),
            VendorId = vendor.Id,
            CategoryId = category.Id,
            Name = "Whole Milk",
            Slug = "whole-milk",
            Price = 4.50m,
            SKU = "MLK-001",
            Status = ProductStatus.Active
        };
        var inventory = new Inventory { Id = Guid.NewGuid(), ProductId = product.Id, QuantityAvailable = 20 };

        context.Users.Add(vendorUser);
        context.Vendors.Add(vendor);
        context.Categories.Add(category);
        context.Products.Add(product);
        context.Inventories.Add(inventory);
        await context.SaveChangesAsync();

        var mockSender = new Mock<ISender>();
        var getCartHandler = new GetCartQueryHandler(context, GetDefaultMarketplaceOptions());
        mockSender
            .Setup(s => s.Send(It.IsAny<GetCartQuery>(), It.IsAny<CancellationToken>()))
            .Returns((GetCartQuery q, CancellationToken ct) => getCartHandler.Handle(q, ct));

        var addHandler = new AddToCartCommandHandler(context, mockSender.Object);
        var command = new AddToCartCommand(customerId, product.Id, 2);

        // Act
        var result = await addHandler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.VendorGroups);
        Assert.Equal("Dairy Fresh", result.VendorGroups[0].VendorStoreName);
        Assert.Single(result.VendorGroups[0].Items);
        Assert.Equal("Whole Milk", result.VendorGroups[0].Items[0].ProductName);
        Assert.Equal(4.50m, result.VendorGroups[0].Items[0].UnitPrice);
        Assert.Equal(2, result.VendorGroups[0].Items[0].Quantity);
        Assert.Equal(9.00m, result.VendorGroups[0].Items[0].TotalPrice);
        Assert.Equal(9.00m, result.SubTotal);
        Assert.Equal(5.00m, result.EstimatedDeliveryFee);
        Assert.Equal(14.00m, result.GrandTotal);
    }

    [Fact]
    public async Task AddToCartCommand_MultipleVendors_GroupsCartByVendor()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var customerId = Guid.NewGuid();

        var vendor1User = new User { Id = Guid.NewGuid(), Email = "v1@test.com", FirstName = "V1", LastName = "Owner" };
        var vendor1 = new Vendor { Id = Guid.NewGuid(), UserId = vendor1User.Id, StoreName = "Farm Fresh Dairy", Status = "Approved" };
        
        var vendor2User = new User { Id = Guid.NewGuid(), Email = "v2@test.com", FirstName = "V2", LastName = "Owner" };
        var vendor2 = new Vendor { Id = Guid.NewGuid(), UserId = vendor2User.Id, StoreName = "Orchard Valley", Status = "Approved" };

        var category = new Category { Id = Guid.NewGuid(), Name = "Food", Slug = "food" };

        var prod1 = new Product { Id = Guid.NewGuid(), VendorId = vendor1.Id, CategoryId = category.Id, Name = "Butter", Slug = "butter", Price = 3.00m, SKU = "BTR-01", Status = ProductStatus.Active };
        var inv1 = new Inventory { Id = Guid.NewGuid(), ProductId = prod1.Id, QuantityAvailable = 10 };

        var prod2 = new Product { Id = Guid.NewGuid(), VendorId = vendor2.Id, CategoryId = category.Id, Name = "Apples", Slug = "apples", Price = 5.00m, SKU = "APL-01", Status = ProductStatus.Active };
        var inv2 = new Inventory { Id = Guid.NewGuid(), ProductId = prod2.Id, QuantityAvailable = 15 };

        context.Users.AddRange(vendor1User, vendor2User);
        context.Vendors.AddRange(vendor1, vendor2);
        context.Categories.Add(category);
        context.Products.AddRange(prod1, prod2);
        context.Inventories.AddRange(inv1, inv2);
        await context.SaveChangesAsync();

        var mockSender = new Mock<ISender>();
        var getCartHandler = new GetCartQueryHandler(context, GetDefaultMarketplaceOptions());
        mockSender
            .Setup(s => s.Send(It.IsAny<GetCartQuery>(), It.IsAny<CancellationToken>()))
            .Returns((GetCartQuery q, CancellationToken ct) => getCartHandler.Handle(q, ct));

        var addHandler = new AddToCartCommandHandler(context, mockSender.Object);

        // Act
        await addHandler.Handle(new AddToCartCommand(customerId, prod1.Id, 2), CancellationToken.None);
        var result = await addHandler.Handle(new AddToCartCommand(customerId, prod2.Id, 1), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.VendorGroups.Count);
        Assert.Equal(3, result.TotalItems);
        Assert.Equal(11.00m, result.SubTotal); // (2*3) + (1*5) = 11
        Assert.Equal(5.00m, result.EstimatedDeliveryFee);
        Assert.Equal(16.00m, result.GrandTotal);
    }

    [Fact]
    public async Task AddToCartCommand_ExceedingAvailableStock_ThrowsInvalidOperationException()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var customerId = Guid.NewGuid();
        var vendorUser = new User { Id = Guid.NewGuid(), Email = "v@test.com", FirstName = "V", LastName = "O" };
        var vendor = new Vendor { Id = Guid.NewGuid(), UserId = vendorUser.Id, StoreName = "Limited Store", Status = "Approved" };
        var category = new Category { Id = Guid.NewGuid(), Name = "Items", Slug = "items" };
        var product = new Product { Id = Guid.NewGuid(), VendorId = vendor.Id, CategoryId = category.Id, Name = "Rare Item", Slug = "rare-item", Price = 10.00m, SKU = "RRE-01", Status = ProductStatus.Active };
        var inventory = new Inventory { Id = Guid.NewGuid(), ProductId = product.Id, QuantityAvailable = 3 };

        context.Users.Add(vendorUser);
        context.Vendors.Add(vendor);
        context.Categories.Add(category);
        context.Products.Add(product);
        context.Inventories.Add(inventory);
        await context.SaveChangesAsync();

        var mockSender = new Mock<ISender>();
        var addHandler = new AddToCartCommandHandler(context, mockSender.Object);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            addHandler.Handle(new AddToCartCommand(customerId, product.Id, 5), CancellationToken.None));

        Assert.Contains("Maximum available stock is 3", ex.Message);
    }

    [Fact]
    public async Task UpdateCartItemCommand_WhenQuantityZero_RemovesItem()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var customerId = Guid.NewGuid();
        var vendorUser = new User { Id = Guid.NewGuid(), Email = "v@test.com", FirstName = "V", LastName = "O" };
        var vendor = new Vendor { Id = Guid.NewGuid(), UserId = vendorUser.Id, StoreName = "Store", Status = "Approved" };
        var category = new Category { Id = Guid.NewGuid(), Name = "Cat", Slug = "cat" };
        var product = new Product { Id = Guid.NewGuid(), VendorId = vendor.Id, CategoryId = category.Id, Name = "Cheese", Slug = "cheese", Price = 2.50m, SKU = "CHS-01", Status = ProductStatus.Active };
        var inventory = new Inventory { Id = Guid.NewGuid(), ProductId = product.Id, QuantityAvailable = 10 };

        var cart = new LocalMart.Domain.Entities.Cart { Id = Guid.NewGuid(), CustomerId = customerId };
        var cartItem = new LocalMart.Domain.Entities.CartItem { Id = Guid.NewGuid(), CartId = cart.Id, ProductId = product.Id, Quantity = 2, UnitPrice = 2.50m };
        cart.Items.Add(cartItem);

        context.Users.Add(vendorUser);
        context.Vendors.Add(vendor);
        context.Categories.Add(category);
        context.Products.Add(product);
        context.Inventories.Add(inventory);
        context.Carts.Add(cart);
        await context.SaveChangesAsync();

        var mockSender = new Mock<ISender>();
        var getCartHandler = new GetCartQueryHandler(context, GetDefaultMarketplaceOptions());
        mockSender
            .Setup(s => s.Send(It.IsAny<GetCartQuery>(), It.IsAny<CancellationToken>()))
            .Returns((GetCartQuery q, CancellationToken ct) => getCartHandler.Handle(q, ct));

        var updateHandler = new UpdateCartItemCommandHandler(context, mockSender.Object);

        // Act
        var result = await updateHandler.Handle(new UpdateCartItemCommand(customerId, cartItem.Id, 0), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.VendorGroups);
        Assert.Equal(0, result.TotalItems);
        Assert.Equal(0m, result.SubTotal);
    }

    [Fact]
    public async Task ClearCartCommand_RemovesAllItemsFromCart()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var customerId = Guid.NewGuid();
        var vendorUser = new User { Id = Guid.NewGuid(), Email = "v@test.com", FirstName = "V", LastName = "O" };
        var vendor = new Vendor { Id = Guid.NewGuid(), UserId = vendorUser.Id, StoreName = "Store", Status = "Approved" };
        var category = new Category { Id = Guid.NewGuid(), Name = "Cat", Slug = "cat" };
        var product = new Product { Id = Guid.NewGuid(), VendorId = vendor.Id, CategoryId = category.Id, Name = "Yogurt", Slug = "yogurt", Price = 1.50m, SKU = "YGT-01", Status = ProductStatus.Active };
        var inventory = new Inventory { Id = Guid.NewGuid(), ProductId = product.Id, QuantityAvailable = 10 };

        var cart = new LocalMart.Domain.Entities.Cart { Id = Guid.NewGuid(), CustomerId = customerId };
        var cartItem = new LocalMart.Domain.Entities.CartItem { Id = Guid.NewGuid(), CartId = cart.Id, ProductId = product.Id, Quantity = 4, UnitPrice = 1.50m };
        cart.Items.Add(cartItem);

        context.Users.Add(vendorUser);
        context.Vendors.Add(vendor);
        context.Categories.Add(category);
        context.Products.Add(product);
        context.Inventories.Add(inventory);
        context.Carts.Add(cart);
        await context.SaveChangesAsync();

        var mockSender = new Mock<ISender>();
        var getCartHandler = new GetCartQueryHandler(context, GetDefaultMarketplaceOptions());
        mockSender
            .Setup(s => s.Send(It.IsAny<GetCartQuery>(), It.IsAny<CancellationToken>()))
            .Returns((GetCartQuery q, CancellationToken ct) => getCartHandler.Handle(q, ct));

        var clearHandler = new ClearCartCommandHandler(context, mockSender.Object);

        // Act
        var result = await clearHandler.Handle(new ClearCartCommand(customerId), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.VendorGroups);
        Assert.Equal(0, result.TotalItems);
        Assert.Equal(0m, result.SubTotal);
    }
}
