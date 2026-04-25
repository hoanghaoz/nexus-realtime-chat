using NexusChat.Application.Interfaces.Common;
using NexusChat.Domain.Entity;

namespace NexusChat.Application.Interfaces.ConversationRepository;

public interface IConversationRepository : IGenericRepository<Conversation, string>
{
    Task<List<Conversation>> GetUserConversationsAsync(string userId, CancellationToken token);

    Task<bool> IsUserInConversationAsync(string conversationId, string userId, CancellationToken token);
}