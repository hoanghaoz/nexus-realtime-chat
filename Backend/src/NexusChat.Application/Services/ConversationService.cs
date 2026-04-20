using ErrorOr;
using NexusChat.Application.DTOs.Conversation;
using NexusChat.Application.Interfaces.ConversationRepository;
using NexusChat.Application.Interfaces.ConversationService;
using NexusChat.Application.Interfaces.Hubs;
using NexusChat.Application.Interfaces.UserRepository;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Enum;

namespace NexusChat.Application.Services;

public class ConversationService(
    IUserRepository userRepository,
    IConversationRepository conversationRepository,
    IPresenceTracker presenceTracker)
    : IConversationService
{
    public async Task<ErrorOr<List<ConversationResponse>>> GetConversationListAsync(string userId,
        CancellationToken token)
    {
        var user = await userRepository.GetByIdAsync(userId, token);
        if (user is null)
        {
            return Error.NotFound("Conversation.UserNotFound", "User was not found.");
        }

        var conversations = await conversationRepository.GetUserConversationsAsync(userId, token);
        if (conversations.Count == 0) return new List<ConversationResponse>();

        var onlineUserIds = await presenceTracker.GetOnlineUsers();

        var response = new List<ConversationResponse>(conversations.Count);
        foreach (var conversation in conversations)
        {
            response.Add(await MapConversationResponseAsync(conversation, userId, onlineUserIds, token));
        }

        return response;
    }

    public async Task<ErrorOr<List<ConversationResponse>>> SearchConversationAsync(string userId, string keyword,
        CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(keyword))
        {
            return Error.Validation("Conversation.InvalidKeyword", "Keyword is required.");
        }

        var conversations = await GetConversationListAsync(userId, token);
        if (conversations.IsError)
        {
            return conversations.Errors;
        }

        return conversations
            .Value
            .Where(c => c.DisplayName.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    private async Task<ConversationResponse> MapConversationResponseAsync(
        Conversation conversation,
        string currentUserId,
        IReadOnlyCollection<string> onlineUserIds,
        CancellationToken token)
    {
        var lastMessage = conversation.LastMessage is null
            ? null
            : new LastMessagePreviewResponse(conversation.LastMessage.Content, conversation.LastMessage.CreatedAt);

        if (conversation.RoomType == RoomType.Direct)
        {
            // In a direct conversation, there should be exactly two participants. We find the other participant to get their info.
            var otherParticipant = conversation.Participants.FirstOrDefault(p => p.UserId != currentUserId);
            if (otherParticipant is null)
            {
                return new ConversationResponse(
                    TypeRoom: conversation.RoomType,
                    DisplayName: conversation.Name,
                    DisplayAvatar: null,
                    LastMessage: lastMessage,
                    IsOnline: false,
                    Role: GetCurrentUserRole(conversation, currentUserId));
            }
            // Get Information of the other participant to display in the conversation list (e.g., their name and avatar)
            var otherUser = await userRepository.GetByIdAsync(otherParticipant.UserId, token);
            return new ConversationResponse(
                TypeRoom: conversation.RoomType,
                DisplayName: otherUser?.UserName ?? conversation.Name,
                DisplayAvatar: otherUser?.Avatar,
                LastMessage: lastMessage,
                IsOnline: onlineUserIds.Contains(otherParticipant.UserId),
                Role: GetCurrentUserRole(conversation, currentUserId));
        }

        var hasAnyOtherParticipantOnline = conversation.Participants
            .Where(p => p.UserId != currentUserId)
            .Any(p => onlineUserIds.Contains(p.UserId));

        return new ConversationResponse(
            TypeRoom: conversation.RoomType,
            DisplayName: conversation.Name,
            DisplayAvatar: null,
            LastMessage: lastMessage,
            IsOnline: hasAnyOtherParticipantOnline,
            Role: GetCurrentUserRole(conversation, currentUserId));
    }

    private static string GetCurrentUserRole(Conversation conversation, string currentUserId)
    {
        if (conversation.RoomType == RoomType.Direct)
        {
            return "admin";
        }

        return string.Equals(conversation.CreatedBy, currentUserId, StringComparison.Ordinal)
            ? "admin"
            : "member";
    }
}