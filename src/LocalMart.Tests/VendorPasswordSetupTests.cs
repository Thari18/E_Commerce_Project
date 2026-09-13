using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation.TestHelper;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using LocalMart.Application.Features.Auth.Commands;
using LocalMart.Application.Features.Auth.Queries;
using LocalMart.Application.Features.VendorApplications.Commands;
using LocalMart.Domain.Entities;
using LocalMart.Infrastructure.Identity;
using LocalMart.Infrastructure.Persistence;
using LocalMart.Infrastructure.Services;
using LocalMart.Application.Common.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace LocalMart.Tests;

public class VendorPasswordSetupTests
{
    private readonly IPasswordHasher _passwordHasher = new PasswordHasherAdapter();

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

    // 1. Guest vendor approved -> password setup token generated
    [Fact]
    public async Task GuestVendor_Approved_GeneratesPasswordSetupToken()
    {
        using var context = GetDbContext();
        var emailMock = new Mock<IEmailService>();

        var applicant = new User
        {
            Id = Guid.NewGuid(),
            Email = "guestvendor@shop.com",
            PasswordHash = string.Empty, // Guest applicant without password
            FirstName = "Guest",
            LastName = "Vendor",
            IsActive = true
        };
        context.Users.Add(applicant);

        var application = new VendorApplication
        {
            Id = Guid.NewGuid(),
            ApplicantUserId = applicant.Id,
            BusinessName = "Guest Fresh Mart",
            ContactEmail = applicant.Email,
            OwnerFullName = "Guest Vendor",
            Status = "Pending",
            SubmittedAt = DateTime.UtcNow
        };
        context.VendorApplications.Add(application);
        await context.SaveChangesAsync();

        var adminId = Guid.NewGuid();
        var handler = new ApproveVendorApplicationCommandHandler(context, emailMock.Object);
        var result = await handler.Handle(new ApproveVendorApplicationCommand(application.Id, adminId), CancellationToken.None);

        Assert.Equal("Approved", result.Status);

        // Assert token generated in database
        var token = await context.PasswordResetTokens.FirstOrDefaultAsync(t => t.UserId == applicant.Id);
        Assert.NotNull(token);
        Assert.False(token.IsUsed);
        Assert.Equal("VendorActivation", token.TokenType);
        Assert.True(token.ExpiresAt > DateTime.UtcNow);

        // Assert email dispatched
        emailMock.Verify(e => e.SendVendorApprovalPasswordSetupEmailAsync(
            applicant.Email,
            "Guest Vendor",
            It.Is<string>(url => url.Contains("/vendor/set-password?token=")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GuestVendor_Approved_UsesConfiguredFrontendBaseUrl()
    {
        using var context = GetDbContext();
        var emailMock = new Mock<IEmailService>();

        var applicant = new User
        {
            Id = Guid.NewGuid(),
            Email = "customurl@shop.com",
            PasswordHash = string.Empty,
            FirstName = "Custom",
            LastName = "Vendor",
            IsActive = true
        };
        context.Users.Add(applicant);

        var application = new VendorApplication
        {
            Id = Guid.NewGuid(),
            ApplicantUserId = applicant.Id,
            BusinessName = "Custom URL Mart",
            ContactEmail = applicant.Email,
            OwnerFullName = "Custom Vendor",
            Status = "Pending",
            SubmittedAt = DateTime.UtcNow
        };
        context.VendorApplications.Add(application);
        await context.SaveChangesAsync();

        var customBaseUrl = "https://marketplace.localmart.lk";
        var optionsMock = Options.Create(new FrontendSettings { BaseUrl = customBaseUrl });
        var handler = new ApproveVendorApplicationCommandHandler(context, emailMock.Object, optionsMock);

        await handler.Handle(new ApproveVendorApplicationCommand(application.Id, Guid.NewGuid()), CancellationToken.None);

        emailMock.Verify(e => e.SendVendorApprovalPasswordSetupEmailAsync(
            applicant.Email,
            "Custom Vendor",
            It.Is<string>(url => url.StartsWith("https://marketplace.localmart.lk/vendor/set-password?token=")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // 2. Existing customer vendor approval -> existing password remains valid
    [Fact]
    public async Task ExistingCustomer_VendorApproval_PreservesExistingPassword()
    {
        using var context = GetDbContext();
        var emailMock = new Mock<IEmailService>();

        var existingHash = _passwordHasher.HashPassword("ExistingCustomerPass123!");
        var customer = new User
        {
            Id = Guid.NewGuid(),
            Email = "existingcustomer@localmart.com",
            PasswordHash = existingHash, // Already has password
            FirstName = "Existing",
            LastName = "Customer",
            IsActive = true
        };
        context.Users.Add(customer);

        var application = new VendorApplication
        {
            Id = Guid.NewGuid(),
            ApplicantUserId = customer.Id,
            BusinessName = "Existing Customer Mart",
            ContactEmail = customer.Email,
            OwnerFullName = "Existing Customer",
            Status = "Pending",
            SubmittedAt = DateTime.UtcNow
        };
        context.VendorApplications.Add(application);
        await context.SaveChangesAsync();

        var handler = new ApproveVendorApplicationCommandHandler(context, emailMock.Object);
        await handler.Handle(new ApproveVendorApplicationCommand(application.Id, Guid.NewGuid()), CancellationToken.None);

        // Assert no setup token generated
        var token = await context.PasswordResetTokens.FirstOrDefaultAsync(t => t.UserId == customer.Id);
        Assert.Null(token);

        // Assert existing password hash is preserved
        var updatedCustomer = await context.Users.FindAsync(customer.Id);
        Assert.Equal(existingHash, updatedCustomer!.PasswordHash);

        // Assert standard notification email dispatched (NOT setup email)
        emailMock.Verify(e => e.SendVendorApprovalNotificationEmailAsync(
            customer.Email,
            "Existing Customer",
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // 3. Valid token -> password successfully created
    [Fact]
    public async Task ValidToken_SuccessfullyCreatesPassword()
    {
        using var context = GetDbContext();
        var rawToken = "secure_random_hex_token_1234567890abcdef";
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "vendor@market.com",
            PasswordHash = string.Empty,
            FirstName = "Market",
            LastName = "Vendor",
            IsActive = true
        };
        context.Users.Add(user);

        var setupToken = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            TokenType = "VendorActivation",
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsUsed = false
        };
        context.PasswordResetTokens.Add(setupToken);
        await context.SaveChangesAsync();

        var handler = new SetVendorPasswordCommandHandler(context, _passwordHasher);
        var command = new SetVendorPasswordCommand(rawToken, "NewVendorSecret2026!", "NewVendorSecret2026!");

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.Success);

        var updatedUser = await context.Users.FindAsync(user.Id);
        Assert.NotEmpty(updatedUser!.PasswordHash);
        Assert.True(_passwordHasher.VerifyPassword("NewVendorSecret2026!", updatedUser.PasswordHash));
        Assert.True(setupToken.IsUsed);
        Assert.NotNull(setupToken.UsedAt);
    }

    // 4. Invalid token -> rejected
    [Fact]
    public async Task InvalidToken_Rejected()
    {
        using var context = GetDbContext();
        var handler = new SetVendorPasswordCommandHandler(context, _passwordHasher);
        var command = new SetVendorPasswordCommand("completely_unknown_token", "Pass12345!", "Pass12345!");

        await Assert.ThrowsAsync<KeyNotFoundException>(() => handler.Handle(command, CancellationToken.None));
    }

    // 5. Expired token -> rejected
    [Fact]
    public async Task ExpiredToken_Rejected()
    {
        using var context = GetDbContext();
        var rawToken = "expired_token_1234567890";
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

        var user = new User { Id = Guid.NewGuid(), Email = "user@test.com", PasswordHash = "" };
        context.Users.Add(user);

        var setupToken = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            TokenType = "VendorActivation",
            ExpiresAt = DateTime.UtcNow.AddMinutes(-10), // Expired
            IsUsed = false
        };
        context.PasswordResetTokens.Add(setupToken);
        await context.SaveChangesAsync();

        var handler = new SetVendorPasswordCommandHandler(context, _passwordHasher);
        var command = new SetVendorPasswordCommand(rawToken, "ValidPassword123!", "ValidPassword123!");

        await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(command, CancellationToken.None));
    }

    // 6. Used token -> rejected
    [Fact]
    public async Task UsedToken_Rejected()
    {
        using var context = GetDbContext();
        var rawToken = "already_used_token_1234567890";
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

        var user = new User { Id = Guid.NewGuid(), Email = "user@test.com", PasswordHash = "" };
        context.Users.Add(user);

        var setupToken = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            TokenType = "VendorActivation",
            ExpiresAt = DateTime.UtcNow.AddHours(12),
            IsUsed = true, // Already used
            UsedAt = DateTime.UtcNow.AddMinutes(-5)
        };
        context.PasswordResetTokens.Add(setupToken);
        await context.SaveChangesAsync();

        var handler = new SetVendorPasswordCommandHandler(context, _passwordHasher);
        var command = new SetVendorPasswordCommand(rawToken, "ValidPassword123!", "ValidPassword123!");

        await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(command, CancellationToken.None));
    }

    // 7. Token cannot be reused after successful password setup
    [Fact]
    public async Task Token_CannotBeReused_AfterSuccessfulPasswordSetup()
    {
        using var context = GetDbContext();
        var rawToken = "single_use_token_999888";
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

        var user = new User { Id = Guid.NewGuid(), Email = "singleuse@test.com", PasswordHash = "" };
        context.Users.Add(user);

        var setupToken = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            TokenType = "VendorActivation",
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsUsed = false
        };
        context.PasswordResetTokens.Add(setupToken);
        await context.SaveChangesAsync();

        var handler = new SetVendorPasswordCommandHandler(context, _passwordHasher);

        // First use: Succeeded
        var firstResult = await handler.Handle(new SetVendorPasswordCommand(rawToken, "FirstPassword123!", "FirstPassword123!"), CancellationToken.None);
        Assert.True(firstResult.Success);

        // Second use: Throws
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new SetVendorPasswordCommand(rawToken, "SecondPassword123!", "SecondPassword123!"), CancellationToken.None));
    }

    // 8. Password is hashed, never stored plaintext
    [Fact]
    public async Task Password_IsHashed_NeverPlaintext()
    {
        using var context = GetDbContext();
        var rawToken = "plain_check_token_111";
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
        var plainPassword = "SecretPlainPassword123!";

        var user = new User { Id = Guid.NewGuid(), Email = "plain@test.com", PasswordHash = "" };
        context.Users.Add(user);

        var setupToken = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            TokenType = "VendorActivation",
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsUsed = false
        };
        context.PasswordResetTokens.Add(setupToken);
        await context.SaveChangesAsync();

        var handler = new SetVendorPasswordCommandHandler(context, _passwordHasher);
        await handler.Handle(new SetVendorPasswordCommand(rawToken, plainPassword, plainPassword), CancellationToken.None);

        var updatedUser = await context.Users.FindAsync(user.Id);
        Assert.NotEqual(plainPassword, updatedUser!.PasswordHash);
        Assert.DoesNotContain(plainPassword, updatedUser.PasswordHash);
        Assert.True(_passwordHasher.VerifyPassword(plainPassword, updatedUser.PasswordHash));
    }

    // 9. PasswordHash is never returned through DTOs
    [Fact]
    public async Task PasswordHash_NeverExposedInDTOs()
    {
        using var context = GetDbContext();
        var rawToken = "dto_leak_token_222";
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

        var user = new User { Id = Guid.NewGuid(), Email = "dto_test@store.com", PasswordHash = "SomeSuperSecretHash" };
        context.Users.Add(user);

        var setupToken = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            TokenType = "VendorActivation",
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsUsed = false
        };
        context.PasswordResetTokens.Add(setupToken);
        await context.SaveChangesAsync();

        var verifyHandler = new VerifyVendorPasswordSetupTokenQueryHandler(context);
        var verifyResult = await verifyHandler.Handle(new VerifyVendorPasswordSetupTokenQuery(rawToken), CancellationToken.None);

        // Verification DTO only contains masked email and status, never PasswordHash
        Assert.True(verifyResult.IsValid);
        Assert.Contains("***", verifyResult.Email);

        var setPasswordHandler = new SetVendorPasswordCommandHandler(context, _passwordHasher);
        var setResult = await setPasswordHandler.Handle(new SetVendorPasswordCommand(rawToken, "NewPass1234!", "NewPass1234!"), CancellationToken.None);

        // Response DTO only contains boolean and message
        Assert.True(setResult.Success);
        Assert.DoesNotContain("Hash", setResult.Message);
    }

    // 10. Rejected application cannot create password setup token
    [Fact]
    public async Task RejectedApplication_CannotGenerateToken()
    {
        using var context = GetDbContext();
        var emailMock = new Mock<IEmailService>();

        var applicant = new User { Id = Guid.NewGuid(), Email = "rejected@vendor.com", PasswordHash = "" };
        context.Users.Add(applicant);

        var application = new VendorApplication
        {
            Id = Guid.NewGuid(),
            ApplicantUserId = applicant.Id,
            BusinessName = "Rejected Mart",
            Status = "Rejected",
            RejectionReason = "Documents incomplete"
        };
        context.VendorApplications.Add(application);
        await context.SaveChangesAsync();

        var handler = new ApproveVendorApplicationCommandHandler(context, emailMock.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new ApproveVendorApplicationCommand(application.Id, Guid.NewGuid()), CancellationToken.None));

        var token = await context.PasswordResetTokens.FirstOrDefaultAsync(t => t.UserId == applicant.Id);
        Assert.Null(token);
        emailMock.Verify(e => e.SendVendorApprovalPasswordSetupEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // 11. Duplicate account creation is prevented
    [Fact]
    public async Task DuplicateAccountCreation_Prevented()
    {
        using var context = GetDbContext();
        var emailMock = new Mock<IEmailService>();

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "dupe@vendor.com",
            PasswordHash = "",
            FirstName = "First",
            LastName = "User",
            IsActive = true
        };
        context.Users.Add(existingUser);

        var app1 = new VendorApplication
        {
            Id = Guid.NewGuid(),
            ApplicantUserId = existingUser.Id,
            BusinessName = "Shop One",
            ContactEmail = existingUser.Email,
            Status = "Pending"
        };
        context.VendorApplications.Add(app1);
        await context.SaveChangesAsync();

        var handler = new ApproveVendorApplicationCommandHandler(context, emailMock.Object);
        await handler.Handle(new ApproveVendorApplicationCommand(app1.Id, Guid.NewGuid()), CancellationToken.None);

        // Try approving again -> rejected as already approved
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new ApproveVendorApplicationCommand(app1.Id, Guid.NewGuid()), CancellationToken.None));

        // Total users with this email remains 1
        var userCount = await context.Users.CountAsync(u => u.Email == "dupe@vendor.com");
        Assert.Equal(1, userCount);
    }

    // 12. Approval email/onboarding notification is triggered appropriately
    [Fact]
    public async Task ApprovalEmail_TriggeredAppropriately_UsingLoggingEmailService()
    {
        LoggingEmailService.ClearSentEmails();
        var logger = new NullLogger<LoggingEmailService>();
        var emailService = new LoggingEmailService(logger);

        // Guest setup email
        await emailService.SendVendorApprovalPasswordSetupEmailAsync(
            "guest@vendor.com",
            "Guest Vendor",
            "http://localhost:4200/vendor/set-password?token=sample123"
        );

        // Existing customer notification email
        await emailService.SendVendorApprovalNotificationEmailAsync(
            "existing@customer.com",
            "Existing Customer"
        );

        var emails = LoggingEmailService.SentEmails.ToList();
        Assert.Equal(2, emails.Count);
        Assert.Contains(emails, e => e.RecipientEmail == "guest@vendor.com" && e.Subject.Contains("Set Your Password"));
        Assert.Contains(emails, e => e.RecipientEmail == "existing@customer.com" && !e.Subject.Contains("Set Your Password"));
    }
}
