using ErrorOr;
using NexusChat.Application.DTOs.Conversation;
using NexusChat.Application.DTOs.Rooms;

namespace NexusChat.Application.Interfaces.ConversationService;

public interface IConversationService
{
    public Task<ErrorOr<List<ConversationResponse>>> GetConversationListAsync(string userId, CancellationToken token);

    public Task<ErrorOr<List<ConversationResponse>>> SearchConversationAsync(string userId, string keyword,
        CancellationToken token);
    
    Task<ErrorOr<ConversationDetailResponse>> GetConversationDetailAsync(string conversationId,string currentUserId,CancellationToken token);

    Task<ErrorOr<GroupResponseDto>> CreateDirectConversationAsync(string creatorId, string targetUserId, CancellationToken token);
}