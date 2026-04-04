using System.Xml.Xsl;
using NexusChat.Application.DTOs;
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
            message.Attachments.Select(ob => new AttachmentDto(
                    ob.FileUrl ?? string.Empty,
                    ob.FileSize ?? 0,
                    ob.FileName ?? string.Empty,
                    ob.FileType))
                .ToList(),
            message.Reactions.Select(re => new ReactionDto(
                    re.FromUserId,
                    re.Emoji))
                .ToList(),
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
            Attachments = dto.Attachments?.Select(a => new Attachment
            {
                FileUrl = a.FileUrl,
                FileSize = a.FileSize,
                FileName = a.FileName,
                FileType = a.Type
            }).ToList() ?? [],
            CreatedAt = DateTime.UtcNow,
        };
    }
}