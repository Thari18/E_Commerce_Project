namespace LocalMart.Application.Common.Interfaces;

public interface IPhotoService
{
    Task<string?> UploadImageAsync(Stream fileStream, string fileName, string folder = "products");
    Task<bool> DeleteImageAsync(string publicId);
}
