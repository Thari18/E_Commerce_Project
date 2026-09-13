using System.Text;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Infrastructure.Identity;
using LocalMart.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace LocalMart.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
                            ?? configuration.GetConnectionString("SupabaseConnection");
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(connectionString, b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));
        }
        else
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("LocalMartDevDb"));
        }

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
        services.AddTransient<IPasswordHasher, PasswordHasherAdapter>();
        services.AddTransient<IJwtTokenGenerator, JwtTokenGenerator>();

        // Cloudinary Image Upload Service
        services.Configure<LocalMart.Infrastructure.Services.CloudinarySettings>(configuration.GetSection("CloudinarySettings"));
        services.AddScoped<IPhotoService, LocalMart.Infrastructure.Services.CloudinaryPhotoService>();

        // JWT Authentication Configuration
        var secretKey = configuration["JwtSettings:Secret"] ?? "LocalMartSuperSecretKey2026LocationAwareMarketplaceKey!";
        var issuer = configuration["JwtSettings:Issuer"] ?? "LocalMartAPI";
        var audience = configuration["JwtSettings:Audience"] ?? "LocalMartClients";

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin"));
            options.AddPolicy("RequireVendor", policy => policy.RequireRole("Vendor"));
            options.AddPolicy("RequireCustomer", policy => policy.RequireRole("Customer"));
            options.AddPolicy("RequireDeliveryStaff", policy => policy.RequireRole("Delivery Staff"));
        });

        return services;
    }
}
