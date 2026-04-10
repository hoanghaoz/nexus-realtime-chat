using NexusChat.Application.DTOs.FriendRequests;
using NexusChat.Application.DTOs.Message;

namespace NexusChat.Application.Interfaces.Hubs;

/// <summary>
///     Interface for the chat client, which defines the methods that the server can call on the client.
/// </summary>
public interface IChatClient
{
    public Task ReceiveMessage(MessageResponseDto message);
    public Task NotifyUserJoined(string userId, string conversationId);
    public Task NotifyUserLeft(string userId, string conversationId);
    public Task UserTyping(string userId, string conversationId, bool isTyping);
    public Task UserGotTagged(MessageResponseDto message);
    public Task ReceiveFriendRequest(FriendRequestDto request);
    public Task ReceiveAcceptFriendNotification(AcceptFriendNotificationDto dto);

    public Task ReceiveErrorMessage(string message);

    public Task MessageUpdateNotify(string conversationId, string messageId, string newContent,
        CancellationToken token);

    public Task MessageDeleteNotify(string conversationId, string messageId, CancellationToken token);

    public Task MessageReactNotify(string conversationId, string messageId, string emoji, string fromUserId,
        CancellationToken token);

    public Task ReceiveToastNotification(string fromUserId, string messageId, string emoji, CancellationToken token);
}