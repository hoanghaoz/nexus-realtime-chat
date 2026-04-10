using NexusChat.Application.DTOs.Message;
using NexusChat.Application.DTOs.FriendRequests;

namespace NexusChat.Application.Interfaces.Hubs;

/// <summary>
/// Interface for the chat client, which defines the methods that the server can call on the client.
/// </summary>
public interface IChatClient
{
    public Task ReceiveMessage(MessageResponseDto message);
    public Task NotifyUserJoined(string userId,string conversationId);
    public Task NotifyUserLeft(string userId, string conversationId);
    public Task UserTyping(string userId, string conversationId, bool isTyping);
    public Task UserGotTagged(MessageResponseDto message);
    public Task ReceiveFriendRequest(FriendRequestDto request);
    public Task ReceiveAcceptFriendNotification(AcceptFriendNotificationDto dto);
    
    public Task ReceiveErrorMessage(string message);
}