using System.Security.Cryptography;
using System.Text;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.Features.Auth.Commands;
using LocalMart.Domain.Entities;
using LocalMart.Infrastructure.Identity;
using LocalMart.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace LocalMart.Tests;

public class RefreshTokenAndLogoutTests
{
    private readonly DbContextOptions<ApplicationDbContext> _dbOptions;
    private readonly JwtTokenGenerator _jwtTokenGenerator;

    public RefreshTokenAndLogoutTests()
    {
        _dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var jwtSettings = Options.Create(new JwtSettings
        {
            Secret = "ThisIsA32ByteLongSecretKeyForTestingPurposesOnly!",
            Issuer = "LocalMartTestAPI",
            Audience = "LocalMartTestClients",
            ExpiryMinutes = 60
        });

        _jwtTokenGenerator = new JwtTokenGenerator(jwtSettings);
    }

    private ApplicationDbContext CreateContext()
    {
        return new ApplicationDbContext(_dbOptions);
    }

    private async Task<User> SeedActiveUserAsync(ApplicationDbContext context)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "activeuser@example.com",
            PasswordHash = "HashedPassword123!",
            FirstName = "Active",
            LastName = "User",
            IsActive = true
        };

        var role = new Role { Id = Guid.NewGuid(), Name = "Customer" };
        var userRole = new UserRole { UserId = user.Id, RoleId = role.Id, User = user, Role = role };

        context.Users.Add(user);
        context.Roles.Add(role);
        context.UserRoles.Add(userRole);
        await context.SaveChangesAsync();

        return user;
    }

    [Fact]
    public async Task RefreshToken_ValidToken_ReturnsNewAccessAndRefreshToken()
    {
        // Arrange
        using var context = CreateContext();
        var user = await SeedActiveUserAsync(context);

        var rawRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawRefreshToken)));

        context.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var handler = new RefreshTokenCommandHandler(context, _jwtTokenGenerator);
        var command = new RefreshTokenCommand(rawRefreshToken);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(result.RefreshToken));
        Assert.NotEqual(rawRefreshToken, result.RefreshToken);

        // Verify original token is now marked revoked
        var originalToken = await context.RefreshTokens.FirstOrDefaultAsync(r => r.Token == tokenHash);
        Assert.NotNull(originalToken);
        Assert.True(originalToken.IsRevoked);
        Assert.NotNull(originalToken.RevokedAt);

        // Verify new token is stored as SHA256 hash in DB
        var newHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(result.RefreshToken)));
        var newStoredToken = await context.RefreshTokens.FirstOrDefaultAsync(r => r.Token == newHash);
        Assert.NotNull(newStoredToken);
        Assert.False(newStoredToken.IsRevoked);
    }

    [Fact]
    public async Task RefreshToken_ExpiredToken_ThrowsUnauthorizedException()
    {
        // Arrange
        using var context = CreateContext();
        var user = await SeedActiveUserAsync(context);

        var rawRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawRefreshToken)));

        context.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(-10), // Expired
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow.AddDays(-8)
        });
        await context.SaveChangesAsync();

        var handler = new RefreshTokenCommandHandler(context, _jwtTokenGenerator);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new RefreshTokenCommand(rawRefreshToken), CancellationToken.None));

        Assert.Contains("expired", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task RefreshToken_RevokedToken_TriggersReuseProtectionAndRevokesAllSessions()
    {
        // Arrange
        using var context = CreateContext();
        var user = await SeedActiveUserAsync(context);

        var stolenRawToken = _jwtTokenGenerator.GenerateRefreshToken();
        var stolenTokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(stolenRawToken)));

        // Revoked token (previously rotated)
        context.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = stolenTokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(5),
            IsRevoked = true, // Revoked!
            RevokedAt = DateTime.UtcNow.AddHours(-1)
        });

        // Another active token for the same user
        var activeRawToken = _jwtTokenGenerator.GenerateRefreshToken();
        var activeTokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(activeRawToken)));
        var activeToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = activeTokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(5),
            IsRevoked = false
        };
        context.RefreshTokens.Add(activeToken);
        await context.SaveChangesAsync();

        var handler = new RefreshTokenCommandHandler(context, _jwtTokenGenerator);

        // Act & Assert (Attempting to use stolen/revoked token)
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new RefreshTokenCommand(stolenRawToken), CancellationToken.None));

        Assert.Contains("reuse", ex.Message, StringComparison.OrdinalIgnoreCase);

        // Verify that token theft protection revoked ALL active tokens for this user
        var checkActiveToken = await context.RefreshTokens.FindAsync(activeToken.Id);
        Assert.NotNull(checkActiveToken);
        Assert.True(checkActiveToken.IsRevoked);
        Assert.NotNull(checkActiveToken.RevokedAt);
    }

    [Fact]
    public async Task RefreshToken_InvalidToken_ThrowsUnauthorizedException()
    {
        // Arrange
        using var context = CreateContext();
        await SeedActiveUserAsync(context);

        var handler = new RefreshTokenCommandHandler(context, _jwtTokenGenerator);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new RefreshTokenCommand("NonExistentRefreshToken12345"), CancellationToken.None));

        Assert.Contains("Invalid refresh token", ex.Message);
    }

    [Fact]
    public async Task RefreshToken_SuspendedOrInactiveUser_ThrowsUnauthorizedException()
    {
        // Arrange
        using var context = CreateContext();
        var inactiveUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "suspended@example.com",
            PasswordHash = "HashedPassword123!",
            FirstName = "Inactive",
            LastName = "User",
            IsActive = false // Suspended!
        };
        context.Users.Add(inactiveUser);

        var rawToken = _jwtTokenGenerator.GenerateRefreshToken();
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

        context.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = inactiveUser.Id,
            Token = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        });
        await context.SaveChangesAsync();

        var handler = new RefreshTokenCommandHandler(context, _jwtTokenGenerator);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new RefreshTokenCommand(rawToken), CancellationToken.None));

        Assert.Contains("inactive or suspended", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Logout_ValidToken_RevokesTokenOnBackend()
    {
        // Arrange
        using var context = CreateContext();
        var user = await SeedActiveUserAsync(context);

        var rawToken = _jwtTokenGenerator.GenerateRefreshToken();
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

        var token = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };
        context.RefreshTokens.Add(token);
        await context.SaveChangesAsync();

        var logoutHandler = new LogoutCommandHandler(context);

        // Act
        var logoutResult = await logoutHandler.Handle(new LogoutCommand(rawToken, user.Id), CancellationToken.None);

        // Assert
        Assert.True(logoutResult.Success);

        var updatedToken = await context.RefreshTokens.FindAsync(token.Id);
        Assert.NotNull(updatedToken);
        Assert.True(updatedToken.IsRevoked);
        Assert.NotNull(updatedToken.RevokedAt);
    }

    [Fact]
    public async Task RefreshToken_AfterLogout_FailsDueToRevocation()
    {
        // Arrange
        using var context = CreateContext();
        var user = await SeedActiveUserAsync(context);

        var rawToken = _jwtTokenGenerator.GenerateRefreshToken();
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

        context.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        });
        await context.SaveChangesAsync();

        var logoutHandler = new LogoutCommandHandler(context);
        var refreshHandler = new RefreshTokenCommandHandler(context, _jwtTokenGenerator);

        // 1. Perform Logout
        await logoutHandler.Handle(new LogoutCommand(rawToken, user.Id), CancellationToken.None);

        // 2. Attempt Refresh After Logout
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            refreshHandler.Handle(new RefreshTokenCommand(rawToken), CancellationToken.None));

        Assert.Contains("revoked", ex.Message, StringComparison.OrdinalIgnoreCase);
    }
}
