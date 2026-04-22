using NexusChat.Application.DTOs.Message;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Entity.EmbeddedObject;

namespace NexusChat.Application.Extension;

public static class MessageMapping
{
    public static MessageResponseDto MapMessageDto(this Message message)
    {
        return new MessageResponseDto(
            message.Id,
            message.FromUserId,
            message.Content,
            message.ConversationId,
            message.CreatedAt,
            message.Attachments.Select(ob => ob switch
                {
                    FileAttachment file => (AttachmentBaseDto) new FileAttachmentDto(
                        file.FileUrl ?? string.Empty, 
                        file.FileName ?? string.Empty,
                        file.FileSize,
                        file.FileType,
                        file.CreatedAt
                    ),
                    LinkPreviewAttachment link => new LinkPreviewDto(
                        link.PreviewLinkUrl ?? string.Empty,
                        link.Title ?? string.Empty,
                        link.Description ?? string.Empty,
                        link.ImageUrl ?? string.Empty,
                        link.CreatedAt
                    ),
                    _ => throw new InvalidOperationException($"Unknown attachment type: {ob.GetType().Name}")
                })
                .ToList(),
            message.Reactions.Select(re => new ReactionDto(
                    re.FromUserId,
                    re.Emoji))
                .ToList(),
            message.MentionedUsersId,
            message.IsDeleted,
            message.IsEdited,
            message.DeletedAt,
            message.EditedAt
        );
    }

    public static Message MapToEntity(this SendMessageRequestDto dto, string fromUserId)
    {
        return new Message
        {
            ConversationId = dto.ConversationId,
            FromUserId = fromUserId,
            Content = dto.Content,
            Reactions = [],
            Attachments = dto.Attachments?.Select(a => a switch
            {
                FileAttachmentDto file => (Attachment) new FileAttachment
                {
                    FileUrl = file.FileUrl,
                    FileName = file.FileName,
                    FileSize = file.FileSize ?? 0,
                    FileType = file.Type,
                    CreatedAt = file.CreatedAt
                },
                LinkPreviewDto link => new LinkPreviewAttachment
                {
                    PreviewLinkUrl = link.PreviewLinkUrl,
                    FileType = link.Type,
                    Title = link.Title,
                    Description = link.Description,
                    ImageUrl = link.ImageUrl,
                    CreatedAt = link.CreatedAt
                },
                _ => throw new InvalidOperationException($"Unknown attachment type: {a.GetType().Name}")
            }).ToList() ?? [],
            CreatedAt = DateTime.UtcNow
        };
    }
}