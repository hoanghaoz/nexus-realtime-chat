using NexusChat.Application.DTOs.FriendRequests;
using NexusChat.Application.DTOs.Message;
using NexusChat.Application.DTOs.Rooms;

namespace NexusChat.Application.Interfaces.Hubs;

/// <summary>
///     Interface for the chat client, which defines the SignalR methods that the server calls on connected clients.
/// </summary>
/// <remarks>
///     All methods are called by the backend via SignalR to push real-time updates to the frontend.
///     The frontend must implement listeners for these methods to receive and handle the notifications.
/// </remarks>
public interface IChatClient
{
    /// <summary>
    ///     Receives a new message from the conversation.
    /// </summary>
    /// <param name="message">The message details including ID, content, sender, timestamp, and metadata.</param>
    public Task ReceiveMessage(MessageResponseDto message);

    /// <summary>
    ///     Notifies that a user has joined the conversation.
    /// </summary>
    /// <param name="userId">The ID of the user who joined.</param>
    /// <param name="conversationId">The conversation ID where the user joined.</param>
    public Task NotifyUserJoined(string userId, string conversationId);

    /// <summary>
    ///     Notifies that a user has left the conversation.
    /// </summary>
    /// <param name="userId">The ID of the user who left.</param>
    /// <param name="conversationId">The conversation ID where the user left.</param>
    public Task NotifyUserLeft(string userId, string conversationId);

    /// <summary>
    ///     Notifies when a user is typing or stops typing.
    /// </summary>
    /// <param name="userId">The ID of the user typing.</param>
    /// <param name="conversationId">The conversation ID where typing is happening.</param>
    /// <param name="isTyping">True if user is typing; false if stopped typing.</param>
    public Task UserTypingNotify(string userId, string conversationId, bool isTyping);

    /// <summary>
    ///     Notifies a user when they are tagged/mentioned in a message.
    /// </summary>
    /// <param name="message">The message containing the tag/mention.</param>
    public Task UserGotTaggedNotify(MessageResponseDto message);

    /// <summary>
    ///     Receives a friend request from another user.
    /// </summary>
    /// <param name="request">The friend request details including sender ID and request ID.</param>
    public Task ReceiveFriendRequest(FriendRequestDto request);

    /// <summary>
    ///     Receives notification that a friend request was accepted.
    /// </summary>
    /// <param name="dto">The acceptance notification containing details about the new friendship.</param>
    public Task ReceiveAcceptFriendNotification(AcceptFriendNotificationDto dto);

    /// <summary>
    ///     Receives an error message from the server.
    /// </summary>
    /// <param name="message">The error message text.</param>
    public Task ReceiveErrorMessage(string message);

    /// <summary>
    ///     Notifies that a message has been edited.
    /// </summary>
    /// <param name="conversationId">The conversation ID containing the edited message.</param>
    /// <param name="messageId">The ID of the edited message.</param>
    /// <param name="newContent">The updated message content.</param>
    /// <param name="token">Cancellation token for the operation.</param>
    public Task MessageUpdateNotify(string conversationId, string messageId, string newContent,
        CancellationToken token);

    /// <summary>
    ///     Notifies that a message has been deleted.
    /// </summary>
    /// <param name="conversationId">The conversation ID containing the deleted message.</param>
    /// <param name="messageId">The ID of the deleted message.</param>
    /// <param name="token">Cancellation token for the operation.</param>
    public Task MessageDeleteNotify(string conversationId, string messageId, CancellationToken token);

    /// <summary>
    ///     Notifies that a reaction was added to a message.
    /// </summary>
    /// <param name="conversationId">The conversation ID containing the reacted message.</param>
    /// <param name="messageId">The ID of the message that received the reaction.</param>
    /// <param name="emoji">The emoji or reaction type.</param>
    /// <param name="fromUserId">The ID of the user who reacted.</param>
    /// <param name="token">Cancellation token for the operation.</param>
    public Task MessageReactNotify(string conversationId, string messageId, string emoji, string fromUserId,
        CancellationToken token);

    /// <summary>
    ///     Sends a toast notification to the message owner when someone reacts to their message.
    /// </summary>
    /// <param name="fromUserId">The ID of the user who reacted.</param>
    /// <param name="messageId">The ID of the message that received the reaction.</param>
    /// <param name="emoji">The emoji or reaction type.</param>
    /// <param name="token">Cancellation token for the operation.</param>
    public Task ReceiveToastNotification(string fromUserId, string messageId, string emoji, CancellationToken token);

    Task ReceiveAddedToGroupNotification(GroupResponseDto group);
}