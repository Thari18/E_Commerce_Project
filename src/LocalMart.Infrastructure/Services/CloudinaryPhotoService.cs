using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using LocalMart.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace LocalMart.Infrastructure.Services;

public class CloudinaryPhotoService : IPhotoService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryPhotoService(IOptions<CloudinarySettings> config)
    {
        var acc = new Account(
            config.Value.CloudName,
            config.Value.ApiKey,
            config.Value.ApiSecret
        );

        _cloudinary = new Cloudinary(acc);
    }

    public async Task<string?> UploadImageAsync(Stream fileStream, string fileName, string folder = "products")
    {
        if (fileStream == null || fileStream.Length == 0) return null;

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, fileStream),
            Folder = folder,
            Transformation = new Transformation().Width(800).Height(800).Crop("limit")
        };

        var uploadResult = await _cloudinary.UploadAsync(uploadParams);

        if (uploadResult.Error != null)
        {
            throw new Exception($"Cloudinary upload error: {uploadResult.Error.Message}");
        }

        return uploadResult.SecureUrl?.ToString();
    }

    public async Task<bool> DeleteImageAsync(string publicId)
    {
        var deleteParams = new DeletionParams(publicId);
        var result = await _cloudinary.DestroyAsync(deleteParams);
        return result.Result == "ok";
    }
}
