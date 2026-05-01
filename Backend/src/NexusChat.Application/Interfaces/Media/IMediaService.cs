using NexusChat.Application.DTOs.Media;

namespace NexusChat.Application.Interfaces.Media;

public interface IMediaService
{
    Task<List<MediaResponseDto>> GetConversationMediaAsync(string conversationId, string userId, GetMediaRequestDto request, CancellationToken token);
}