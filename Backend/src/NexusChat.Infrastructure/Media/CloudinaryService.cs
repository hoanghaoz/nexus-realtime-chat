using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using ErrorOr;
using NexusChat.Application.Interfaces.Media;
using Error = ErrorOr.Error;

namespace NexusChat.Infrastructure.Media;

public class CloudinaryService(ICloudinary cloudinary) : IMediaService
{
    private static readonly string[] ImgExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".bmp" };
    private static readonly string[] VideoExtensions = { ".mp4", ".avi", ".mov", ".wmv", ".flv" };
    private static readonly string[] FileExtensions = { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt" };

    public async Task<ErrorOr<string>> UploadMediaAsync(Stream stream, string filename, long fileSize, 
        CancellationToken token)
    {
        var extension = Path.GetExtension(filename).ToLowerInvariant();
        var folder = "nexus_chat/other";

        if (ImgExtensions.Contains(extension))
        {            
            folder = "nexus_chat/images";
        }
        else if (VideoExtensions.Contains(extension))
        {
            folder = "nexus_chat/videos";
        }
        else if (FileExtensions.Contains(extension))
        {
            folder = "nexus_chat/files";
        }

        var uploadParams = new AutoUploadParams
        {
            File = new FileDescription(filename, stream),
            UploadPreset = "nexus_chat_preset",
            Folder = folder
        };
        
        var result = await cloudinary.UploadAsync(uploadParams, token);
        if(result.Error != null)
        {
            return Error.Failure("MediaUpload.Failed", result.Error.Message);
        }
        return result.SecureUrl.ToString();
    }
}