using NexusChat.Application.DTOs.FriendRequests;
using NexusChat.Application.DTOs.Hubs;

namespace NexusChat.Application.Interfaces.Hubs;

/// <summary>
/// Interface for the chat client, which defines the methods that the server can call on the client.
/// </summary>
public interface IChatClient
{
    public Task ReceiveMessage(MessageDto message);
    public Task NotifyUserJoined(string userId,string conversationId);
    public Task NotifyUserLeft(string userId, string conversationId);
    public Task UserTyping(string userId, string conversationId, bool isTyping);
    public Task UserGotTagged(MessageDto message);
    public Task ReceiveFriendRequest(FriendRequestDto request);
}