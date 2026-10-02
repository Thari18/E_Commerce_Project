using System.Text;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Infrastructure.Identity;
using LocalMart.Infrastructure.Persistence;
using LocalMart.Infrastructure.Services;
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
        services.AddScoped<IEmailService, SmtpEmailService>();

        // Email & Frontend Settings Configuration
        services.Configure<LocalMart.Application.Common.Models.SmtpSettings>(configuration.GetSection(LocalMart.Application.Common.Models.SmtpSettings.SectionName));
        services.Configure<LocalMart.Application.Common.Models.FrontendSettings>(configuration.GetSection(LocalMart.Application.Common.Models.FrontendSettings.SectionName));

        // JWT Settings Options & Token Generator
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.AddTransient<IJwtTokenGenerator, JwtTokenGenerator>();

        // Cloudinary Image Upload & Media Signing Services
        services.Configure<CloudinarySettings>(configuration.GetSection("CloudinarySettings"));
        services.AddScoped<IPhotoService, CloudinaryPhotoService>();
        services.AddScoped<ICloudinaryMediaService, CloudinaryMediaService>();

        // JWT Authentication Configuration - Strict Validation (No Fallback)
        var jwtSection = configuration.GetSection(JwtSettings.SectionName);
        var secretKey = jwtSection["Secret"];
        var issuer = jwtSection["Issuer"] ?? "LocalMartAPI";
        var audience = jwtSection["Audience"] ?? "LocalMartClients";

        if (string.IsNullOrWhiteSpace(secretKey))
        {
            throw new InvalidOperationException("Application configuration error: JWT secret key is missing (JwtSettings:Secret). A secure key must be configured in environment variables or user secrets.");
        }

        if (Encoding.UTF8.GetBytes(secretKey).Length < 32)
        {
            throw new InvalidOperationException("Application configuration error: JWT secret key must be at least 256 bits (32 bytes) in length.");
        }

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
