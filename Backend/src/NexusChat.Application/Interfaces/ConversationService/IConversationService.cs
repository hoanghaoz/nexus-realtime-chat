using ErrorOr;
using NexusChat.Application.DTOs.Conversation;

namespace NexusChat.Application.Interfaces.ConversationService;

public interface IConversationService
{
    public Task<ErrorOr<List<ConversationResponse>>> GetConversationListAsync(string userId, CancellationToken token);

    public Task<ErrorOr<List<ConversationResponse>>> SearchConversationAsync(string userId, string keyword,
        CancellationToken token);
}