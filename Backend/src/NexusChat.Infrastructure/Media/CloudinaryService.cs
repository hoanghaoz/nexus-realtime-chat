using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using ErrorOr;
using NexusChat.Application.Interfaces.Media;
using Error = ErrorOr.Error;

namespace NexusChat.Infrastructure.Media;

public class CloudinaryService(ICloudinary cloudinary) : IUploadService
{
    private static readonly string[] ImgExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };
    private static readonly string[] VideoExtensions = { ".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".webm" };
    private static readonly string[] AudioExtensions = { ".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac" };
    private static readonly string[] FileExtensions = { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".zip", ".rar"};

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
        else if (AudioExtensions.Contains(extension))
        {
            folder = "nexus_chat/audio";
        }
        else if (FileExtensions.Contains(extension))
        {
            folder = "nexus_chat/files";
        }

        var uploadParams = new AutoUploadParams
        {
            File = new FileDescription(filename, stream),
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
