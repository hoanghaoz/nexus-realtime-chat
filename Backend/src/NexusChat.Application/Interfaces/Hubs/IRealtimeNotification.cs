namespace NexusChat.Application.Interfaces.Hubs;

public interface IRealtimeNotification
{
    Task NotifyMessageEditedAsync(string conversationId, string messageId, string newContent, CancellationToken token);
    Task NotifyMessageDeletedAsync(string conversationId, string messageId, CancellationToken token);

    Task NotifyMessageReactedAsync(string conversationId, string messageId, string emoji, string fromUserId,
        string toUserId, CancellationToken token);
}