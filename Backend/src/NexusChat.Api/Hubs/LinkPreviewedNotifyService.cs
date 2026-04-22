using Microsoft.AspNetCore.SignalR;
using NexusChat.Application.DTOs.Media;
using NexusChat.Application.Interfaces.Hubs;

namespace NexusChat.Api.Hubs;

/// <summary>
/// Sends link preview updates to conversation members via SignalR.
/// </summary>
public class LinkPreviewedNotifyService(IHubContext<ChatHub, IChatClient> hubContext) : INotifyLinkPreviewed
{
    /// <summary>
    /// Pushes link preview data to all clients in the conversation.
    /// </summary>
    /// <param name="messageId">Message id that contains the link.</param>
    /// <param name="conversationId">Conversation id to broadcast to.</param>
    /// <param name="linkPreviewResponseDto">Preview payload sent to clients.</param>
    /// <param name="token">Request cancellation token.</param>
    /// <remarks>
    /// Frontend integration:
    /// - Listen to SignalR event: <c>UpdateLinkPreview</c>
    /// - Event payload shape:
    ///   <code>
    ///   {
    ///     MessageId: string,
    ///     Attachment: {
    ///       PreviewLinkUrl: string,
    ///       Title: string?,
    ///       Description: string?,
    ///       ImageUrl: string?
    ///     }
    ///   }
    ///   </code>
    /// - Find the message by <c>MessageId</c>, replace/update its link-preview attachment,
    ///   and re-render the preview card in the message list.
    /// </remarks>
    public async Task NotifyLinkPreviewedAsync(string messageId, string conversationId,
        LinkPreviewResponseDto linkPreviewResponseDto, CancellationToken token)
    {
        var payload = new
        {
            MessageId = messageId,
            Attachment = linkPreviewResponseDto
        };
        await hubContext.Clients.Group(conversationId).UpdateLinkPreview(payload);
    }
}