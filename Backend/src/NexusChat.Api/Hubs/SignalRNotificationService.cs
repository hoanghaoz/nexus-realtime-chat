using Microsoft.AspNetCore.SignalR;
using NexusChat.Application.DTOs.Rooms;
using NexusChat.Application.Interfaces.Hubs;

namespace NexusChat.Api.Hubs;

/// <summary>
///     Service for sending real-time notifications to clients via SignalR.
/// </summary>
public class SignalRNotificationService(IHubContext<ChatHub, IChatClient> hubContext) : IRealtimeNotification
{
    /// <summary>
    ///     Notifies all clients in a conversation that a message has been edited.
    /// </summary>
    /// <param name="conversationId">The conversation identifier.</param>
    /// <param name="messageId">The message identifier being updated.</param>
    /// <param name="newContent">The updated message content.</param>
    /// <param name="token">Cancellation token for the operation.</param>
    /// <remarks>
    ///     <strong>Frontend receives via SignalR method: <c>MessageUpdateNotify</c></strong>
    ///     with parameters: <c>conversationId</c>, <c>messageId</c>, <c>newContent</c>.
    /// </remarks>
    public async Task NotifyMessageEditedAsync(string conversationId, string messageId, string newContent,
        CancellationToken token)
    {
        await hubContext.Clients.Group(conversationId)
            .MessageUpdateNotify(conversationId, messageId, newContent, token);
    }

    /// <summary>
    ///     Notifies all clients in a conversation that a message has been deleted.
    /// </summary>
    /// <param name="conversationId">The conversation identifier.</param>
    /// <param name="messageId">The message identifier being deleted.</param>
    /// <param name="token">Cancellation token for the operation.</param>
    /// <remarks>
    ///     <strong>Frontend receives via SignalR method: <c>MessageDeleteNotify</c></strong>
    ///     with parameters: <c>conversationId</c>, <c>messageId</c>.
    /// </remarks>
    public async Task NotifyMessageDeletedAsync(string conversationId, string messageId, CancellationToken token)
    {
        await hubContext.Clients.Group(conversationId).MessageDeleteNotify(conversationId, messageId, token);
    }

    /// <summary>
    ///     Notifies all clients about a message reaction and sends a toast notification to the message owner.
    /// </summary>
    /// <param name="conversationId">The conversation identifier.</param>
    /// <param name="messageId">The message identifier being reacted to.</param>
    /// <param name="emoji">The emoji or reaction type.</param>
    /// <param name="fromUserId">The user ID of who reacted.</param>
    /// <param name="toUserId">The message owner's user ID.</param>
    /// <param name="token">Cancellation token for the operation.</param>
    /// <remarks>
    ///     <strong>All conversation members receive via SignalR method: <c>MessageReactNotify</c></strong>
    ///     with parameters: <c>conversationId</c>, <c>messageId</c>, <c>emoji</c>, <c>fromUserId</c>.
    ///     <para><strong>Message owner also receives via SignalR method: <c>ReceiveToastNotification</c></strong></para>
    ///     with parameters: <c>fromUserId</c>, <c>messageId</c>, <c>emoji</c> (only if fromUserId != toUserId).
    /// </remarks>
    public async Task NotifyMessageReactedAsync(string conversationId, string messageId, string emoji,
        string fromUserId,
        string toUserId, CancellationToken token)
    {
        await hubContext.Clients.Group(conversationId)
            .MessageReactNotify(conversationId, messageId, emoji, fromUserId, token);
        if (fromUserId != toUserId)
            await hubContext.Clients.User(toUserId).ReceiveToastNotification(fromUserId,messageId, emoji, token);
    }

    public async Task NotifyAddedToGroupAsync(List<string> userIds, GroupResponseDto group, CancellationToken token)
    {
        await hubContext.Clients.Users(userIds).ReceiveAddedToGroupNotification(group);
    }
}