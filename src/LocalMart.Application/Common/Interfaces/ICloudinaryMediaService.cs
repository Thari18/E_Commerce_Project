namespace LocalMart.Application.Common.Interfaces;

public record CloudinarySignedUploadParameters(
    string ApiKey,
    long Timestamp,
    string Signature,
    string CloudName,
    string Folder
);

public interface ICloudinaryMediaService
{
    CloudinarySignedUploadParameters GenerateSignedUploadParameters(string folder = "products");
}
