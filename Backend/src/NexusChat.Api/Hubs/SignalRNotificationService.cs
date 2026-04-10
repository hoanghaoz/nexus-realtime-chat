using Microsoft.AspNetCore.SignalR;
using NexusChat.Application.Interfaces.Hubs;

namespace NexusChat.Api.Hubs;

public class SignalRNotificationService(IHubContext<ChatHub, IChatClient> hubContext) : IRealtimeNotification
{
    public async Task NotifyMessageEditedAsync(string conversationId, string messageId, string newContent,
        CancellationToken token)
    {
        await hubContext.Clients.Group(conversationId)
            .MessageUpdateNotify(conversationId, messageId, newContent, token);
    }

    public async Task NotifyMessageDeletedAsync(string conversationId, string messageId, CancellationToken token)
    {
        await hubContext.Clients.Group(conversationId).MessageDeleteNotify(conversationId, messageId, token);
    }

    public async Task NotifyMessageReactedAsync(string conversationId, string messageId, string emoji,
        string fromUserId,
        string toUserId, CancellationToken token)
    {
        await hubContext.Clients.Group(conversationId)
            .MessageReactNotify(conversationId, messageId, emoji, fromUserId, token);
        if (fromUserId != toUserId)
            await hubContext.Clients.User(toUserId).ReceiveToastNotification(fromUserId,messageId, emoji, token);
    }
}