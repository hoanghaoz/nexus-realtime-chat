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
            message.Attachments.Select(MapAttachmentToDto)
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
            Id = Guid.NewGuid().ToString(),
            ConversationId = dto.ConversationId,
            FromUserId = fromUserId,
            Content = dto.Content,
            Reactions = [],
            Attachments = dto.Attachments?.Select(MapDtoToAttachment).ToList() ?? [],
            CreatedAt = DateTime.UtcNow
        };
    }

    private static AttachmentBaseDto MapAttachmentToDto(Attachment attachment)
    {
        return attachment switch
        {
            FileAttachment file => new FileAttachmentDto(
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
            _ => throw new InvalidOperationException($"Unknown attachment type: {attachment.GetType().Name}")
        };
    }

    private static Attachment MapDtoToAttachment(AttachmentBaseDto attachment)
    {
        return attachment switch
        {
            FileAttachmentDto file => new FileAttachment
            {
                FileUrl = file.FileUrl,
                FileName = file.FileName,
                FileSize = file.FileSize ?? 0,
                FileType = file.Type,
                CreatedAt = DateTime.UtcNow
            },
            _ => throw new InvalidOperationException($"Unknown attachment type: {attachment.GetType().Name}")
        };
    }
}