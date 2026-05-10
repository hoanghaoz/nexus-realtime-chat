using NexusChat.Application.DTOs.Media;
using ErrorOr;
namespace NexusChat.Application.Interfaces.Media;

public interface IMediaService
{
    public Task<ErrorOr<List<GetMediaResponseDto>>> GetConversationMediaAsync(string conversationId, string userId, GetMediaRequestDto request, CancellationToken token);

    public Task<ErrorOr<UploadMediaResponseDto>> UploadMediaAsync(
        string conversationId, string userId, Stream stream, string filename, long fileSize, CancellationToken token);
}
