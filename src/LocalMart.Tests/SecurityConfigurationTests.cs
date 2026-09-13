using System.IdentityModel.Tokens.Jwt;
using System.Text;
using LocalMart.Infrastructure;
using LocalMart.Infrastructure.Identity;
using LocalMart.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace LocalMart.Tests;

public class SecurityConfigurationTests
{
    [Fact]
    public void JwtTokenGenerator_ThrowsInvalidOperationException_WhenSecretIsMissing()
    {
        // Arrange
        var options = Options.Create(new JwtSettings
        {
            Secret = "",
            Issuer = "LocalMartAPI",
            Audience = "LocalMartClients"
        });

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => new JwtTokenGenerator(options));
        Assert.Contains("JWT signing key is not configured", ex.Message);
    }

    [Fact]
    public void JwtTokenGenerator_ThrowsInvalidOperationException_WhenSecretIsTooShort()
    {
        // Arrange - less than 32 bytes (256 bits)
        var options = Options.Create(new JwtSettings
        {
            Secret = "short-key-less-than-32-chars",
            Issuer = "LocalMartAPI",
            Audience = "LocalMartClients"
        });

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => new JwtTokenGenerator(options));
        Assert.Contains("at least 256 bits (32 bytes)", ex.Message);
    }

    [Fact]
    public async Task JwtTokenGenerator_GeneratesValidToken_WithValidConfiguredSecret()
    {
        // Arrange
        const string validSecret = "ThisIsASecretKeyWithMoreThan32CharactersForTestingPurposesOnly!";
        const string issuer = "LocalMartAPI";
        const string audience = "LocalMartClients";

        var options = Options.Create(new JwtSettings
        {
            Secret = validSecret,
            Issuer = issuer,
            Audience = audience,
            ExpiryMinutes = 60
        });

        var generator = new JwtTokenGenerator(options);
        var userId = Guid.NewGuid();
        var email = "customer@localmart.com";
        var roles = new[] { "Customer" };

        // Act
        var tokenString = generator.GenerateAccessToken(userId, email, roles);

        // Assert
        Assert.False(string.IsNullOrWhiteSpace(tokenString));

        var validationParams = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(validSecret)),
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        var jsonTokenHandler = new Microsoft.IdentityModel.JsonWebTokens.JsonWebTokenHandler();
        var result = await jsonTokenHandler.ValidateTokenAsync(tokenString, validationParams);
        Assert.True(result.IsValid, result.Exception?.ToString());
        Assert.NotNull(result.ClaimsIdentity);
    }

    [Fact]
    public void DependencyInjection_FailsStartup_WhenJwtSecretMissingFromConfiguration()
    {
        // Arrange
        var services = new ServiceCollection();
        var inMemoryConfig = new Dictionary<string, string?>
        {
            { "JwtSettings:Secret", "" },
            { "JwtSettings:Issuer", "LocalMartAPI" },
            { "JwtSettings:Audience", "LocalMartClients" }
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemoryConfig)
            .Build();

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => services.AddInfrastructureServices(configuration));
        Assert.Contains("JWT secret key is missing", ex.Message);
    }

    [Fact]
    public void CloudinaryMediaService_ThrowsInvalidOperationException_WhenCredentialsMissing()
    {
        // Arrange
        var options = Options.Create(new CloudinarySettings
        {
            CloudName = "",
            ApiKey = "",
            ApiSecret = ""
        });

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => new CloudinaryMediaService(options));
        Assert.Contains("Cloudinary configuration is incomplete", ex.Message);
    }

    [Fact]
    public void CloudinaryMediaService_GeneratesSignedUploadParameters_WithoutLeakingApiSecret()
    {
        // Arrange
        const string mockCloudName = "test_cloud";
        const string mockApiKey = "123456789012345";
        const string mockApiSecret = "TestSecretShouldNeverBeExposed123";

        var options = Options.Create(new CloudinarySettings
        {
            CloudName = mockCloudName,
            ApiKey = mockApiKey,
            ApiSecret = mockApiSecret
        });

        var mediaService = new CloudinaryMediaService(options);

        // Act
        var signedParams = mediaService.GenerateSignedUploadParameters("products");

        // Assert
        Assert.NotNull(signedParams);
        Assert.Equal(mockCloudName, signedParams.CloudName);
        Assert.Equal(mockApiKey, signedParams.ApiKey);
        Assert.Equal("products", signedParams.Folder);
        Assert.True(signedParams.Timestamp > 0);
        Assert.False(string.IsNullOrWhiteSpace(signedParams.Signature));

        // CRITICAL SECURITY ASSERTION:
        // Ensure the returned parameter object does not contain the ApiSecret anywhere
        Assert.DoesNotContain(mockApiSecret, signedParams.Signature);
        Assert.DoesNotContain(mockApiSecret, signedParams.CloudName);
        Assert.DoesNotContain(mockApiSecret, signedParams.ApiKey);
        Assert.DoesNotContain(mockApiSecret, signedParams.Folder);
    }
}
