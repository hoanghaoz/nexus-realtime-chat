using ErrorOr;

namespace NexusChat.Application.Interfaces.Media;

public interface IMediaService
{
    Task<ErrorOr<string>> UploadMediaAsync(Stream stream, string filename,long fileSize, CancellationToken token);
}