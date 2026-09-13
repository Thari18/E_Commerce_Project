using LocalMart.Application.Features.Auth.Commands;
using LocalMart.Application.Features.VendorApplications.Commands;
using LocalMart.Domain.Entities;
using LocalMart.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LocalMart.Tests;

public class VendorApplicationTests
{
    private ApplicationDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new ApplicationDbContext(options);

        // Seed roles
        context.Roles.AddRange(
            new Role { Id = Guid.NewGuid(), Name = "Customer", Description = "Customer Role" },
            new Role { Id = Guid.NewGuid(), Name = "Vendor", Description = "Vendor Role" },
            new Role { Id = Guid.NewGuid(), Name = "Admin", Description = "Admin Role" }
        );
        context.SaveChanges();

        return context;
    }

    [Fact]
    public async Task PublicRegistration_ForcesCustomerRoleOnly()
    {
        // Arrange
        using var context = GetDbContext();
        var mockHasher = new Moq.Mock<LocalMart.Application.Common.Interfaces.IPasswordHasher>();
        mockHasher.Setup(h => h.HashPassword(Moq.It.IsAny<string>())).Returns("hashed_pwd");

        var mockTokenGen = new Moq.Mock<LocalMart.Application.Common.Interfaces.IJwtTokenGenerator>();
        mockTokenGen.Setup(t => t.GenerateAccessToken(Moq.It.IsAny<Guid>(), Moq.It.IsAny<string>(), Moq.It.IsAny<IEnumerable<string>>())).Returns("mock_token");
        mockTokenGen.Setup(t => t.GenerateRefreshToken()).Returns("mock_refresh_token");

        var command = new RegisterUserCommand("customer@example.com", "Password123!", "John", "Doe", "+15550001111");
        var handler = new RegisterUserCommandHandler(context, mockHasher.Object, mockTokenGen.Object);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.User.Roles);
        Assert.Equal("Customer", result.User.Roles.First());
    }

    [Fact]
    public async Task SubmitVendorApplication_CreatesPendingApplicationWithoutVendorRole()
    {
        // Arrange
        using var context = GetDbContext();
        var user = new User { Id = Guid.NewGuid(), Email = "applicant@example.com", FirstName = "Jane", LastName = "Smith" };
        context.Users.Add(user);

        var customerRole = context.Roles.First(r => r.Name == "Customer");
        context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = customerRole.Id });
        await context.SaveChangesAsync();

        var command = new SubmitVendorApplicationCommand(
            user.Id,
            "Jane's Bakery",
            "REG-998811",
            "TAX-112233",
            "+15559990000",
            "jane@bakery.com"
        );
        var handler = new SubmitVendorApplicationCommandHandler(context);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Pending", result.Status);

        // Verify Application in DB
        var app = await context.VendorApplications.FirstOrDefaultAsync(a => a.Id == result.ApplicationId);
        Assert.NotNull(app);
        Assert.Equal("Pending", app.Status);

        // Verify Vendor entity NOT created yet
        var vendor = await context.Vendors.FirstOrDefaultAsync(v => v.ApplicationId == app.Id);
        Assert.Null(vendor);

        // Verify User STILL has Customer role only
        var userRoles = await context.UserRoles.Where(ur => ur.UserId == user.Id).ToListAsync();
        Assert.Single(userRoles);
        Assert.Equal(customerRole.Id, userRoles.First().RoleId);
    }

    [Fact]
    public async Task AdminApproveVendorApplication_CreatesVendorEntityAndProvisionsVendorRole()
    {
        // Arrange
        using var context = GetDbContext();
        var user = new User { Id = Guid.NewGuid(), Email = "applicant@example.com", FirstName = "Jane", LastName = "Smith" };
        var admin = new User { Id = Guid.NewGuid(), Email = "admin@example.com", FirstName = "Admin", LastName = "User" };
        context.Users.AddRange(user, admin);

        var customerRole = context.Roles.First(r => r.Name == "Customer");
        context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = customerRole.Id });

        var application = new VendorApplication
        {
            Id = Guid.NewGuid(),
            ApplicantUserId = user.Id,
            BusinessName = "Jane's Bakery",
            BusinessRegistrationNumber = "REG-998811",
            ContactPhone = "+15559990000",
            ContactEmail = "jane@bakery.com",
            Status = "Pending"
        };
        context.VendorApplications.Add(application);
        await context.SaveChangesAsync();

        var approveCommand = new ApproveVendorApplicationCommand(application.Id, admin.Id, 12.50m);
        var handler = new ApproveVendorApplicationCommandHandler(context);

        // Act
        var result = await handler.Handle(approveCommand, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Approved", result.Status);

        // Verify Application Status
        var updatedApp = await context.VendorApplications.FirstAsync(a => a.Id == application.Id);
        Assert.Equal("Approved", updatedApp.Status);
        Assert.Equal(admin.Id, updatedApp.ReviewedByAdminId);

        // Verify Vendor Entity Created
        var vendor = await context.Vendors.FirstOrDefaultAsync(v => v.ApplicationId == application.Id);
        Assert.NotNull(vendor);
        Assert.Equal("Approved", vendor.Status);
        Assert.Equal("Jane's Bakery", vendor.StoreName);
        Assert.Equal(12.50m, vendor.CommissionRate);

        // Verify Vendor Role Provisioned
        var vendorRole = context.Roles.First(r => r.Name == "Vendor");
        var userVendorRole = await context.UserRoles.FirstOrDefaultAsync(ur => ur.UserId == user.Id && ur.RoleId == vendorRole.Id);
        Assert.NotNull(userVendorRole);
    }

    [Fact]
    public async Task AdminRejectVendorApplication_UpdatesStatusToRejectedWithoutVendorRole()
    {
        // Arrange
        using var context = GetDbContext();
        var user = new User { Id = Guid.NewGuid(), Email = "applicant2@example.com", FirstName = "Bob", LastName = "Jones" };
        var admin = new User { Id = Guid.NewGuid(), Email = "admin@example.com", FirstName = "Admin", LastName = "User" };
        context.Users.AddRange(user, admin);

        var application = new VendorApplication
        {
            Id = Guid.NewGuid(),
            ApplicantUserId = user.Id,
            BusinessName = "Bob's Goods",
            BusinessRegistrationNumber = "REG-776655",
            ContactPhone = "+15558881111",
            ContactEmail = "bob@goods.com",
            Status = "Pending"
        };
        context.VendorApplications.Add(application);
        await context.SaveChangesAsync();

        var rejectCommand = new RejectVendorApplicationCommand(application.Id, admin.Id, "Incomplete documentation provided.");
        var handler = new RejectVendorApplicationCommandHandler(context);

        // Act
        var result = await handler.Handle(rejectCommand, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Rejected", result.Status);
        Assert.Equal("Incomplete documentation provided.", result.RejectionReason);

        // Verify Vendor Entity NOT Created
        var vendor = await context.Vendors.FirstOrDefaultAsync(v => v.ApplicationId == application.Id);
        Assert.Null(vendor);

        // Verify Vendor Role NOT Provisioned
        var vendorRole = context.Roles.First(r => r.Name == "Vendor");
        var userVendorRole = await context.UserRoles.FirstOrDefaultAsync(ur => ur.UserId == user.Id && ur.RoleId == vendorRole.Id);
        Assert.Null(userVendorRole);
    }
}
