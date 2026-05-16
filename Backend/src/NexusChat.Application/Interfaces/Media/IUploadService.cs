using ErrorOr;
using NexusChat.Application.DTOs.Media;

namespace NexusChat.Application.Interfaces.Media;

public interface IUploadService
{
    Task<ErrorOr<string>> UploadMediaAsync(Stream stream, string filename,long fileSize, CancellationToken token);
}