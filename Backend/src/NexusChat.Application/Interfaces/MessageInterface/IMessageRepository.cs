using NexusChat.Application.DTOs.Media;
using NexusChat.Application.DTOs.Message;
using NexusChat.Application.Interfaces.Common;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Entity.EmbeddedObject;

namespace NexusChat.Application.Interfaces.MessageInterface;

public interface IMessageRepository : IGenericRepository<Message, string>
{
    Task<List<MessageResponseDto>> GetMessageInConversationAsync(string conversationId, DateTime? cursor,
        string? publicMessageId,string fromUserId ,CancellationToken token);

    Task<MessageResponseDto> UpdateAttachmentAsync(string messageId, LinkPreviewAttachment linkPreviewAttachment,
        CancellationToken token);

    Task<List<Message>> GetMessagesForBotDataAsync(string conversationId, int messageCount, CancellationToken token);

    Task AddListMessageAsync(List<Message> messages, CancellationToken cancellationToken);

    // Media
    Task<List<GetMediaResponseDto>> GetMediaByConversationIdAsync(
        string conversationId, string? type, int skip, int limit, CancellationToken token);

    Task<List<MessageResponseDto>> SearchMessagesByKeywordAsync(
        string conversationId,
        string keyword,
        int skip,
        int limit,
        CancellationToken token);

    Task<List<MessageResponseDto>> GetRepliesByMessageIdAsync(
        string messageId,
        string conversationId,
        CancellationToken token);
}