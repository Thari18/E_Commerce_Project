using FluentValidation.TestHelper;
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

    private static SubmitVendorApplicationCommand CreateSampleCommand(Guid? userId = null)
    {
        return new SubmitVendorApplicationCommand(
            ApplicantUserId: userId,
            OwnerFullName: "Jane Smith",
            OwnerEmail: "jane@bakery.com",
            OwnerPhone: "+15559990000",
            OwnershipType: "Sole Proprietor",
            ResidentialAddress: "123 Main St, Apt 4B",
            IdType: "NationalId",
            IdNumber: "NIC-99887766",
            OwnerPhotoRef: "private/assets/owner_jane.jpg",
            IdDocumentRef: "private/assets/nic_scan.pdf",
            BusinessName: "Jane's Bakery",
            BusinessType: "Bakery",
            BusinessCategory: "Food & Beverage",
            BusinessRegistrationNumber: "REG-998811",
            BusinessDescription: "Fresh daily artisan breads and pastries.",
            BusinessRegistrationDate: new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc),
            TaxIdentificationNumber: "TAX-112233",
            VatRegistrationNumber: "VAT-445566",
            ContactPhone: "+15559990000",
            ContactEmail: "contact@janesbakery.com",
            WebsiteUrl: "https://janesbakery.local",
            SocialMediaUrl: "https://instagram.com/janesbakery",
            AddressLine1: "45 Market Street",
            AddressLine2: "Suite 100",
            City: "Colombo",
            District: "Colombo",
            Province: "Western",
            PostalCode: "00100",
            Latitude: 6.9271,
            Longitude: 79.8612,
            BusinessRegistrationCertificateRef: "private/assets/brc_998811.pdf",
            TinCertificateRef: "private/assets/tin_cert.pdf",
            TradeLicenceRef: "private/assets/trade_licence.pdf",
            OtherLicenceRef: null,
            StoreFrontPhotoRef: "public/stores/storefront.jpg",
            BusinessNameboardPhotoRef: "public/stores/nameboard.jpg",
            StoreInteriorPhotoRef: "public/stores/interior.jpg",
            StoreLogoRef: "public/stores/logo.png",
            TermsAccepted: true,
            MarketplacePolicyAccepted: true,
            InformationAccuracyConfirmed: true
        );
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

        var command = CreateSampleCommand(user.Id);
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
        Assert.Equal("Jane Smith", app.OwnerFullName);
        Assert.Equal("Bakery", app.BusinessType);
        Assert.Equal("Sole Proprietor", app.OwnershipType);
        Assert.Equal("TAX-112233", app.TaxIdentificationNumber);
        Assert.Equal("VAT-445566", app.VatRegistrationNumber);
        Assert.Equal("private/assets/owner_jane.jpg", app.OwnerPhotoRef);
        Assert.Equal("public/stores/storefront.jpg", app.StoreFrontPhotoRef);

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
            OwnerFullName = "Jane Smith",
            OwnerEmail = "jane@bakery.com",
            OwnerPhone = "+15559990000",
            OwnershipType = "Sole Proprietor",
            OwnerPhotoRef = "private/assets/owner_jane.jpg",
            IdDocumentRef = "private/assets/nic_scan.pdf",
            BusinessName = "Jane's Bakery",
            BusinessType = "Bakery",
            BusinessCategory = "Food & Beverage",
            BusinessRegistrationNumber = "REG-998811",
            BusinessDescription = "Fresh daily artisan breads.",
            ContactPhone = "+15559990000",
            ContactEmail = "contact@janesbakery.com",
            AddressLine1 = "45 Market Street",
            City = "Colombo",
            District = "Colombo",
            Province = "Western",
            PostalCode = "00100",
            Latitude = 6.9271,
            Longitude = 79.8612,
            StoreLogoRef = "public/stores/logo.png",
            StoreFrontPhotoRef = "public/stores/storefront.jpg",
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

        // Verify Vendor Entity Created with STORE attributes ONLY (Zero Private Verification Assets copied)
        var vendor = await context.Vendors.FirstOrDefaultAsync(v => v.ApplicationId == application.Id);
        Assert.NotNull(vendor);
        Assert.Equal("Approved", vendor.Status);
        Assert.Equal("Jane's Bakery", vendor.StoreName);
        Assert.Equal("Fresh daily artisan breads.", vendor.Description);
        Assert.Equal("public/stores/logo.png", vendor.LogoUrl);
        Assert.Equal("public/stores/storefront.jpg", vendor.BannerUrl);
        Assert.Equal(6.9271, vendor.Latitude);
        Assert.Equal(79.8612, vendor.Longitude);
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
            OwnerFullName = "Bob Jones",
            OwnerEmail = "bob@goods.com",
            OwnerPhone = "+15558881111",
            OwnershipType = "Company",
            BusinessName = "Bob's Goods",
            BusinessType = "RetailShop",
            BusinessCategory = "General Store",
            BusinessRegistrationNumber = "REG-776655",
            ContactPhone = "+15558881111",
            ContactEmail = "bob@goods.com",
            AddressLine1 = "10 Main Rd",
            City = "Kandy",
            District = "Kandy",
            Province = "Central",
            PostalCode = "20000",
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

    [Fact]
    public void SubmitVendorApplicationValidator_FailsWhenTermsNotAccepted()
    {
        var validator = new SubmitVendorApplicationCommandValidator();
        var command = CreateSampleCommand() with { TermsAccepted = false };

        var result = validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.TermsAccepted);
    }

    [Fact]
    public void SubmitVendorApplicationValidator_FailsWhenRequiredOwnerDetailsMissing()
    {
        var validator = new SubmitVendorApplicationCommandValidator();
        var command = CreateSampleCommand() with { OwnerFullName = "", OwnerEmail = "invalid-email" };

        var result = validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.OwnerFullName);
        result.ShouldHaveValidationErrorFor(x => x.OwnerEmail);
    }

    [Fact]
    public void SubmitVendorApplicationValidator_FailsWhenOwnershipTypeInvalid()
    {
        var validator = new SubmitVendorApplicationCommandValidator();
        var command = CreateSampleCommand() with { OwnershipType = "InvalidType" };

        var result = validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.OwnershipType);
    }
}
