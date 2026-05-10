using NexusChat.Application.DTOs.Media;
using NexusChat.Application.DTOs.Message;
using NexusChat.Application.Interfaces.Common;
using NexusChat.Domain.Entity.EmbeddedObject;

namespace NexusChat.Application.Interfaces.Message;

public interface IMessageRepository : IGenericRepository<Domain.Entity.Message, string>
{
    Task<List<MessageResponseDto>> GetMessageInConversationAsync(string conversationId, DateTime? cursor,
        CancellationToken token);

    Task<MessageResponseDto> UpdateAttachmentAsync(string messageId, LinkPreviewAttachment linkPreviewAttachment,
        CancellationToken token);
    
    // Media
    Task<List<GetMediaResponseDto>> GetMediaByConversationIdAsync(
        string conversationId, string? type, int skip, int limit, CancellationToken token);
}