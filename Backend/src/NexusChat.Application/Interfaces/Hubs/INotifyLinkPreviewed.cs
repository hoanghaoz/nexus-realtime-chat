using NexusChat.Application.DTOs.Media;

namespace NexusChat.Application.Interfaces.Hubs;

public interface INotifyLinkPreviewed
{
    Task NotifyLinkPreviewedAsync(string messageId, string conversationId,
        LinkPreviewResponseDto linkPreviewResponseDto, CancellationToken token);
}