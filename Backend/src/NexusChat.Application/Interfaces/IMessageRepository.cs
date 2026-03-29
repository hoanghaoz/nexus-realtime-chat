using NexusChat.Application.DTOs.Hubs;
using NexusChat.Application.Interfaces.Common;
using NexusChat.Domain.Entity;

namespace NexusChat.Application.Interfaces;

public interface IMessageRepository : IGenericRepository<Message,string>
{
    Task<List<MessageDto>> GetMessageInConversationAsync(string conversationId,DateTime? cursor, CancellationToken token);
}