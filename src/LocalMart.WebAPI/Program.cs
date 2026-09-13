using LocalMart.Application;
using LocalMart.Infrastructure;
using LocalMart.Infrastructure.Persistence;
using LocalMart.WebAPI.Middleware;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add Services
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

builder.Services.AddControllers();

// Configure Authorization Policies for RBAC + Permission Authorization
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanApproveVendors", policy => policy.RequireRole("Admin"));
    options.AddPolicy("CanReadVendorApplications", policy => policy.RequireRole("Admin"));
});

// Configure CORS for Angular Frontend (http://localhost:4200)
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure Swagger with JWT Support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "LocalMart API Specification",
        Version = "v1",
        Description = "Location-Aware Multi-Vendor E-Commerce Marketplace RESTful Web API"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Enable Exception Handling Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Enable Swagger in All Environments for Testing
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "LocalMart API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed Database Roles and Sample Data on Startup
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<LocalMart.Application.Common.Interfaces.IPasswordHasher>();
    
    // Ensure DB Created
    context.Database.EnsureCreated();

    // Seed Roles
    var roles = new[] { "Customer", "Vendor", "Admin", "Delivery Staff" };
    foreach (var roleName in roles)
    {
        if (!context.Roles.Any(r => r.Name == roleName))
        {
            context.Roles.Add(new LocalMart.Domain.Entities.Role
            {
                Id = Guid.NewGuid(),
                Name = roleName,
                Description = $"{roleName} Role"
            });
        }
        context.SaveChanges();
    }

    // Seed Default Development Test Users (Admin, Customer, Vendor)
    var adminRole = context.Roles.First(r => r.Name == "Admin");
    var customerRole = context.Roles.First(r => r.Name == "Customer");
    var vendorRole = context.Roles.First(r => r.Name == "Vendor");

    var adminUser = context.Users.FirstOrDefault(u => u.Email == "admin@localmart.com");
    if (adminUser == null)
    {
        adminUser = new LocalMart.Domain.Entities.User
        {
            Id = Guid.NewGuid(),
            Email = "admin@localmart.com",
            PasswordHash = hasher.HashPassword("AdminPass123!"),
            FirstName = "System",
            LastName = "Administrator",
            PhoneNumber = "+15550000001",
            IsActive = true
        };
        context.Users.Add(adminUser);
        context.UserRoles.Add(new LocalMart.Domain.Entities.UserRole { UserId = adminUser.Id, RoleId = adminRole.Id });
    }
    else
    {
        adminUser.PasswordHash = hasher.HashPassword("AdminPass123!");
    }

    if (!context.Users.Any(u => u.Email == "customer@localmart.com"))
    {
        var custUser = new LocalMart.Domain.Entities.User
        {
            Id = Guid.NewGuid(),
            Email = "customer@localmart.com",
            PasswordHash = hasher.HashPassword("CustomerPass123!"),
            FirstName = "Jane",
            LastName = "Customer",
            PhoneNumber = "+15550000002",
            IsActive = true
        };
        context.Users.Add(custUser);
        context.UserRoles.Add(new LocalMart.Domain.Entities.UserRole { UserId = custUser.Id, RoleId = customerRole.Id });
    }

    // Seed Sample Categories if Empty
    if (!context.Categories.Any())
    {
        var cat1 = new LocalMart.Domain.Entities.Category { Id = Guid.NewGuid(), Name = "Fresh Produce", Slug = "fresh-produce", Description = "Organic fruits and vegetables", ImageUrl = "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80", DisplayOrder = 1 };
        var cat2 = new LocalMart.Domain.Entities.Category { Id = Guid.NewGuid(), Name = "Bakery & Sweets", Slug = "bakery-sweets", Description = "Artisanal bread and fresh pastries", ImageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80", DisplayOrder = 2 };
        var cat3 = new LocalMart.Domain.Entities.Category { Id = Guid.NewGuid(), Name = "Dairy & Eggs", Slug = "dairy-eggs", Description = "Farm-fresh dairy products", ImageUrl = "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=400&q=80", DisplayOrder = 3 };

        context.Categories.AddRange(cat1, cat2, cat3);
        context.SaveChanges();
    }

    // DEVELOPMENT SEED DATA (Approved sample vendors & products for localhost visual verification)
    if (!context.Products.Any())
    {
        var vendorUser = new LocalMart.Domain.Entities.User
        {
            Id = Guid.NewGuid(),
            Email = "vendor@localmart.com",
            PasswordHash = hasher.HashPassword("VendorPass123!"),
            FirstName = "Green Leaf",
            LastName = "Organics",
            PhoneNumber = "+15550192834",
            IsActive = true
        };
        context.Users.Add(vendorUser);
        context.UserRoles.Add(new LocalMart.Domain.Entities.UserRole { UserId = vendorUser.Id, RoleId = vendorRole.Id });

        var vendor = new LocalMart.Domain.Entities.Vendor
        {
            Id = Guid.NewGuid(),
            UserId = vendorUser.Id,
            StoreName = "Green Leaf Organics",
            Description = "Neighborhood Organic Farm Store",
            Status = "Approved"
        };
        context.Vendors.Add(vendor);

        var produceCat = context.Categories.First(c => c.Slug == "fresh-produce");
        var bakeryCat = context.Categories.First(c => c.Slug == "bakery-sweets");
        var dairyCat = context.Categories.First(c => c.Slug == "dairy-eggs");

        var prod1 = new LocalMart.Domain.Entities.Product
        {
            Id = Guid.NewGuid(),
            VendorId = vendor.Id,
            CategoryId = produceCat.Id,
            Name = "Crisp Honeycrisp Apples",
            Slug = "honeycrisp-apples",
            Description = "Freshly harvested organic Honeycrisp apples, rich in flavor and crunch.",
            Price = 4.99m,
            SKU = "PROD-APP-001",
            Status = LocalMart.Domain.Enums.ProductStatus.Active
        };

        var prod2 = new LocalMart.Domain.Entities.Product
        {
            Id = Guid.NewGuid(),
            VendorId = vendor.Id,
            CategoryId = bakeryCat.Id,
            Name = "Artisanal Sourdough Bread",
            Slug = "artisanal-sourdough-bread",
            Description = "Naturally fermented 24-hour sourdough loaf baked fresh daily.",
            Price = 6.50m,
            SKU = "BAK-SDR-002",
            Status = LocalMart.Domain.Enums.ProductStatus.Active
        };

        var prod3 = new LocalMart.Domain.Entities.Product
        {
            Id = Guid.NewGuid(),
            VendorId = vendor.Id,
            CategoryId = dairyCat.Id,
            Name = "Farm Fresh Whole Milk",
            Slug = "farm-fresh-whole-milk",
            Description = "Pasteurized whole milk sourced from local family dairies.",
            Price = 3.99m,
            SKU = "DAI-MLK-003",
            Status = LocalMart.Domain.Enums.ProductStatus.Active
        };

        context.Products.AddRange(prod1, prod2, prod3);

        context.ProductImages.AddRange(
            new LocalMart.Domain.Entities.ProductImage { Id = Guid.NewGuid(), ProductId = prod1.Id, ImageUrl = "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80", IsMain = true },
            new LocalMart.Domain.Entities.ProductImage { Id = Guid.NewGuid(), ProductId = prod2.Id, ImageUrl = "https://images.unsplash.com/photo-1585478259715-876a6a81fc08?auto=format&fit=crop&w=600&q=80", IsMain = true },
            new LocalMart.Domain.Entities.ProductImage { Id = Guid.NewGuid(), ProductId = prod3.Id, ImageUrl = "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80", IsMain = true }
        );

        context.Inventories.AddRange(
            new LocalMart.Domain.Entities.Inventory { Id = Guid.NewGuid(), ProductId = prod1.Id, QuantityAvailable = 50, QuantityReserved = 0 },
            new LocalMart.Domain.Entities.Inventory { Id = Guid.NewGuid(), ProductId = prod2.Id, QuantityAvailable = 30, QuantityReserved = 0 },
            new LocalMart.Domain.Entities.Inventory { Id = Guid.NewGuid(), ProductId = prod3.Id, QuantityAvailable = 40, QuantityReserved = 0 }
        );

        context.SaveChanges();
    }
}

app.Run();
