
using NexusChat.Application.DTOs.Media;
using NexusChat.Application.Interfaces.Media;

namespace NexusChat.Infrastructure.Media;

public class MediaService : IMediaService
{
    public Task<List<MediaResponseDto>> GetConversationMediaAsync(string conversationId, string userId, GetMediaRequestDto request,
        CancellationToken token)
    {
        throw new NotImplementedException();
    }
}