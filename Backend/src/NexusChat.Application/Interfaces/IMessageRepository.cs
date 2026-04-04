using NexusChat.Application.DTOs.Message;
using NexusChat.Application.Interfaces.Common;
using NexusChat.Domain.Entity;

namespace NexusChat.Application.Interfaces;

public interface IMessageRepository : IGenericRepository<Message,string>
{
    Task<List<MessageResponseDto>> GetMessageInConversationAsync(string conversationId,DateTime? cursor, CancellationToken token);
}