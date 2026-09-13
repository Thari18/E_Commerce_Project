using CloudinaryDotNet;
using LocalMart.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace LocalMart.Infrastructure.Services;

public class CloudinaryMediaService : ICloudinaryMediaService
{
    private readonly Cloudinary _cloudinary;
    private readonly CloudinarySettings _settings;

    public CloudinaryMediaService(IOptions<CloudinarySettings> config)
    {
        _settings = config?.Value ?? throw new ArgumentNullException(nameof(config));

        if (string.IsNullOrWhiteSpace(_settings.CloudName) ||
            string.IsNullOrWhiteSpace(_settings.ApiKey) ||
            string.IsNullOrWhiteSpace(_settings.ApiSecret))
        {
            throw new InvalidOperationException("Cloudinary configuration is incomplete. CloudName, ApiKey, and ApiSecret must be configured in secure configuration.");
        }

        var account = new Account(
            _settings.CloudName,
            _settings.ApiKey,
            _settings.ApiSecret
        );

        _cloudinary = new Cloudinary(account);
    }

    public CloudinarySignedUploadParameters GenerateSignedUploadParameters(string folder = "products")
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        var parameters = new SortedDictionary<string, object>
        {
            { "folder", folder },
            { "timestamp", timestamp }
        };

        var signature = _cloudinary.Api.SignParameters(parameters);

        return new CloudinarySignedUploadParameters(
            ApiKey: _settings.ApiKey,
            Timestamp: timestamp,
            Signature: signature,
            CloudName: _settings.CloudName,
            Folder: folder
        );
    }
}
