using LocalMart.Application.Common.Models;
using LocalMart.Application.Features.Orders.Commands;
using LocalMart.Application.Features.Orders.DTOs;
using LocalMart.Application.Features.Orders.Queries;
using LocalMart.Domain.Entities;
using LocalMart.Domain.Enums;
using LocalMart.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Xunit;

namespace LocalMart.Tests;

public class OrderTests
{
    private ApplicationDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"LocalMartOrderTestDb_{Guid.NewGuid()}")
            .Options;

        return new ApplicationDbContext(options);
    }

    private IMemoryCache GetMemoryCache()
    {
        return new MemoryCache(new MemoryCacheOptions());
    }

    private IOptions<MarketplaceOptions> GetDefaultMarketplaceOptions()
    {
        return Options.Create(new MarketplaceOptions { FlatDeliveryFee = 5.00m });
    }

    private (User customer, CustomerAddress address) CreateCustomerAndAddress(ApplicationDbContext context)
    {
        var customer = new User
        {
            Id = Guid.NewGuid(),
            Email = $"customer_{Guid.NewGuid():N}@test.com",
            FirstName = "Jane",
            LastName = "Doe",
            IsActive = true
        };

        var address = new CustomerAddress
        {
            Id = Guid.NewGuid(),
            CustomerId = customer.Id,
            Title = "Home",
            AddressLine1 = "123 Main St",
            City = "Colombo",
            State = "Western",
            PostalCode = "00100"
        };

        context.Users.Add(customer);
        context.CustomerAddresses.Add(address);
        return (customer, address);
    }

    private (Vendor vendor, Product product, Inventory inventory) CreateVendorAndProduct(ApplicationDbContext context, decimal price = 10.00m, decimal commissionRate = 12.50m, int stock = 20)
    {
        var vendorUser = new User { Id = Guid.NewGuid(), Email = $"vendor_{Guid.NewGuid():N}@test.com", FirstName = "Vendor", LastName = "Owner" };
        var vendor = new Vendor { Id = Guid.NewGuid(), UserId = vendorUser.Id, StoreName = $"Store_{Guid.NewGuid():N}", Status = "Approved", CommissionRate = commissionRate };
        var category = new Category { Id = Guid.NewGuid(), Name = "General", Slug = $"gen-{Guid.NewGuid():N}" };
        var product = new Product
        {
            Id = Guid.NewGuid(),
            VendorId = vendor.Id,
            CategoryId = category.Id,
            Name = $"Product_{Guid.NewGuid():N}",
            Slug = $"prod-{Guid.NewGuid():N}",
            Price = price,
            SKU = $"SKU-{Guid.NewGuid():N}",
            Status = ProductStatus.Active
        };
        var inventory = new Inventory { Id = Guid.NewGuid(), ProductId = product.Id, QuantityAvailable = stock };

        context.Users.Add(vendorUser);
        context.Vendors.Add(vendor);
        context.Categories.Add(category);
        context.Products.Add(product);
        context.Inventories.Add(inventory);

        return (vendor, product, inventory);
    }

    [Fact]
    public async Task CreateOrderCommand_EmptyCartRejection_ThrowsInvalidOperationException()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var cache = GetMemoryCache();
        var (customer, address) = CreateCustomerAndAddress(context);
        await context.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(context, cache, GetDefaultMarketplaceOptions());
        var command = new CreateOrderCommand(customer.Id, address.Id, "COD", null, Guid.NewGuid().ToString());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(command, CancellationToken.None));
        Assert.Contains("Cart is empty", ex.Message);
    }

    [Fact]
    public async Task CreateOrderCommand_InvalidShippingAddress_ThrowsInvalidOperationException()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var cache = GetMemoryCache();
        var (customer, _) = CreateCustomerAndAddress(context);
        await context.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(context, cache, GetDefaultMarketplaceOptions());
        var command = new CreateOrderCommand(customer.Id, Guid.NewGuid(), "COD", null, Guid.NewGuid().ToString());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(command, CancellationToken.None));
        Assert.Contains("Shipping address was not found", ex.Message);
    }

    [Fact]
    public async Task CreateOrderCommand_AddressOwnershipValidation_ThrowsInvalidOperationException()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var cache = GetMemoryCache();
        var (customer1, _) = CreateCustomerAndAddress(context);
        var (_, address2) = CreateCustomerAndAddress(context);
        await context.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(context, cache, GetDefaultMarketplaceOptions());
        var command = new CreateOrderCommand(customer1.Id, address2.Id, "COD", null, Guid.NewGuid().ToString());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(command, CancellationToken.None));
        Assert.Contains("Shipping address was not found or does not belong to the authenticated customer", ex.Message);
    }

    [Fact]
    public async Task CreateOrderCommand_SingleVendorOrderCreation_CreatesOrderAndVendorOrderAndItem()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var cache = GetMemoryCache();
        var (customer, address) = CreateCustomerAndAddress(context);
        var (vendor, product, inventory) = CreateVendorAndProduct(context, price: 15.00m, commissionRate: 10.00m, stock: 10);

        var cart = new Cart { Id = Guid.NewGuid(), CustomerId = customer.Id };
        cart.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = cart.Id, ProductId = product.Id, Quantity = 2, UnitPrice = 15.00m });
        context.Carts.Add(cart);
        await context.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(context, cache, GetDefaultMarketplaceOptions());
        var command = new CreateOrderCommand(customer.Id, address.Id, "COD", null, Guid.NewGuid().ToString());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(customer.Id, result.CustomerId);
        Assert.Equal(30.00m, result.SubTotal);
        Assert.Equal(5.00m, result.DeliveryFee);
        Assert.Equal(35.00m, result.GrandTotal);
        Assert.Equal("Pending", result.PaymentStatus);
        Assert.Equal("COD", result.PaymentMethod);

        Assert.Single(result.VendorOrders);
        var vo = result.VendorOrders[0];
        Assert.Equal(vendor.Id, vo.VendorId);
        Assert.Equal(30.00m, vo.SubTotal);
        Assert.Equal(10.00m, vo.CommissionRate);
        Assert.Equal(3.00m, vo.CommissionAmount); // 30 * 10%
        Assert.Equal(27.00m, vo.NetEarnings); // 30 - 3

        Assert.Single(vo.Items);
        Assert.Equal(product.Id, vo.Items[0].ProductId);
        Assert.Equal(15.00m, vo.Items[0].UnitPrice);
        Assert.Equal(2, vo.Items[0].Quantity);
        Assert.Equal(30.00m, vo.Items[0].TotalPrice);

        // Verify inventory decremented
        var updatedInv = await context.Inventories.FirstAsync(i => i.ProductId == product.Id);
        Assert.Equal(8, updatedInv.QuantityAvailable);

        // Verify cart cleared
        var updatedCartItems = await context.CartItems.Where(ci => ci.CartId == cart.Id).ToListAsync();
        Assert.Empty(updatedCartItems);
    }

    [Fact]
    public async Task CreateOrderCommand_MultiVendorOrderSplitting_SplitsVendorOrdersAndCalculatesCommissions()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var cache = GetMemoryCache();
        var (customer, address) = CreateCustomerAndAddress(context);
        var (vendor1, prod1, inv1) = CreateVendorAndProduct(context, price: 20.00m, commissionRate: 10.00m, stock: 10);
        var (vendor2, prod2, inv2) = CreateVendorAndProduct(context, price: 50.00m, commissionRate: 15.00m, stock: 10);

        var cart = new Cart { Id = Guid.NewGuid(), CustomerId = customer.Id };
        cart.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = cart.Id, ProductId = prod1.Id, Quantity = 2, UnitPrice = 20.00m }); // 40
        cart.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = cart.Id, ProductId = prod2.Id, Quantity = 1, UnitPrice = 50.00m }); // 50
        context.Carts.Add(cart);
        await context.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(context, cache, GetDefaultMarketplaceOptions());
        var command = new CreateOrderCommand(customer.Id, address.Id, "Online", null, Guid.NewGuid().ToString());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(90.00m, result.SubTotal);
        Assert.Equal(5.00m, result.DeliveryFee);
        Assert.Equal(95.00m, result.GrandTotal);
        Assert.Equal(2, result.VendorOrders.Count);

        var vo1 = result.VendorOrders.First(v => v.VendorId == vendor1.Id);
        Assert.Equal(40.00m, vo1.SubTotal);
        Assert.Equal(10.00m, vo1.CommissionRate);
        Assert.Equal(4.00m, vo1.CommissionAmount); // 40 * 10%
        Assert.Equal(36.00m, vo1.NetEarnings);

        var vo2 = result.VendorOrders.First(v => v.VendorId == vendor2.Id);
        Assert.Equal(50.00m, vo2.SubTotal);
        Assert.Equal(15.00m, vo2.CommissionRate);
        Assert.Equal(7.50m, vo2.CommissionAmount); // 50 * 15%
        Assert.Equal(42.50m, vo2.NetEarnings);
    }

    [Fact]
    public async Task CreateOrderCommand_InsufficientStockRollback_CartNotClearedAndExceptionThrown()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var cache = GetMemoryCache();
        var (customer, address) = CreateCustomerAndAddress(context);
        var (vendor, product, inventory) = CreateVendorAndProduct(context, price: 10.00m, stock: 2);

        var cart = new Cart { Id = Guid.NewGuid(), CustomerId = customer.Id };
        cart.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = cart.Id, ProductId = product.Id, Quantity = 5, UnitPrice = 10.00m });
        context.Carts.Add(cart);
        await context.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(context, cache, GetDefaultMarketplaceOptions());
        var command = new CreateOrderCommand(customer.Id, address.Id, "COD", null, Guid.NewGuid().ToString());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(command, CancellationToken.None));
        Assert.Contains("Insufficient stock", ex.Message);

        // Verify cart NOT cleared
        var cartItems = await context.CartItems.Where(ci => ci.CartId == cart.Id).ToListAsync();
        Assert.Single(cartItems);

        // Verify inventory NOT decremented
        var currentInv = await context.Inventories.FirstAsync(i => i.ProductId == product.Id);
        Assert.Equal(2, currentInv.QuantityAvailable);
    }

    [Fact]
    public async Task CreateOrderCommand_IdempotencySameKeyReplay_ReturnsCachedResponse()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var cache = GetMemoryCache();
        var (customer, address) = CreateCustomerAndAddress(context);
        var (vendor, product, inventory) = CreateVendorAndProduct(context, price: 20.00m, stock: 50);

        var cart = new Cart { Id = Guid.NewGuid(), CustomerId = customer.Id };
        cart.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = cart.Id, ProductId = product.Id, Quantity = 1, UnitPrice = 20.00m });
        context.Carts.Add(cart);
        await context.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(context, cache, GetDefaultMarketplaceOptions());
        var idempotencyKey = Guid.NewGuid().ToString();
        var command = new CreateOrderCommand(customer.Id, address.Id, "COD", null, idempotencyKey);

        // Act 1: First request
        var result1 = await handler.Handle(command, CancellationToken.None);

        // Act 2: Replay same request with same key
        var result2 = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result1);
        Assert.NotNull(result2);
        Assert.Equal(result1.Id, result2.Id);
        Assert.Equal(result1.OrderNumber, result2.OrderNumber);
    }

    [Fact]
    public async Task CreateOrderCommand_IdempotencySameKeyDifferentRequest_ThrowsInvalidOperationException()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var cache = GetMemoryCache();
        var (customer, address1) = CreateCustomerAndAddress(context);
        var (_, address2) = CreateCustomerAndAddress(context);
        address2.CustomerId = customer.Id; // Point address2 to customer
        context.CustomerAddresses.Add(address2);

        var (vendor, product, inventory) = CreateVendorAndProduct(context, price: 20.00m, stock: 50);

        var cart = new Cart { Id = Guid.NewGuid(), CustomerId = customer.Id };
        cart.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = cart.Id, ProductId = product.Id, Quantity = 1, UnitPrice = 20.00m });
        context.Carts.Add(cart);
        await context.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(context, cache, GetDefaultMarketplaceOptions());
        var idempotencyKey = Guid.NewGuid().ToString();

        var command1 = new CreateOrderCommand(customer.Id, address1.Id, "COD", null, idempotencyKey);
        var command2 = new CreateOrderCommand(customer.Id, address2.Id, "COD", null, idempotencyKey);

        // Act 1: First request
        await handler.Handle(command1, CancellationToken.None);

        // Act 2: Different request with same key
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(command2, CancellationToken.None));
        Assert.Contains("Idempotency key collision", ex.Message);
    }

    [Fact]
    public async Task GetCustomerOrdersQuery_EnforcesCustomerIsolation()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var (customer1, address1) = CreateCustomerAndAddress(context);
        var (customer2, address2) = CreateCustomerAndAddress(context);

        var order1 = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = customer1.Id,
            OrderNumber = "ORD-001",
            ShippingAddressId = address1.Id,
            SubTotal = 50m,
            GrandTotal = 55m,
            CreatedAt = DateTime.UtcNow
        };

        var order2 = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = customer2.Id,
            OrderNumber = "ORD-002",
            ShippingAddressId = address2.Id,
            SubTotal = 100m,
            GrandTotal = 105m,
            CreatedAt = DateTime.UtcNow
        };

        context.Orders.AddRange(order1, order2);
        await context.SaveChangesAsync();

        var handler = new GetCustomerOrdersQueryHandler(context);

        // Act
        var resultCust1 = await handler.Handle(new GetCustomerOrdersQuery(customer1.Id), CancellationToken.None);
        var resultCust2 = await handler.Handle(new GetCustomerOrdersQuery(customer2.Id), CancellationToken.None);

        // Assert
        Assert.Single(resultCust1);
        Assert.Equal("ORD-001", resultCust1[0].OrderNumber);

        Assert.Single(resultCust2);
        Assert.Equal("ORD-002", resultCust2[0].OrderNumber);
    }

    [Fact]
    public async Task GetOrderByIdQuery_DifferentCustomer_ThrowsKeyNotFoundException()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var (customer1, address1) = CreateCustomerAndAddress(context);
        var (customer2, _) = CreateCustomerAndAddress(context);

        var order1 = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = customer1.Id,
            OrderNumber = "ORD-SECRET",
            ShippingAddressId = address1.Id,
            SubTotal = 50m,
            GrandTotal = 55m,
            CreatedAt = DateTime.UtcNow
        };

        context.Orders.Add(order1);
        await context.SaveChangesAsync();

        var handler = new GetOrderByIdQueryHandler(context);

        // Act & Assert (Customer 2 trying to read Customer 1's order)
        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => handler.Handle(new GetOrderByIdQuery(customer2.Id, order1.Id), CancellationToken.None));
        Assert.Contains("was not found", ex.Message);
    }
}
