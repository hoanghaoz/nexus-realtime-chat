using NexusChat.Application.DTOs.Message;

namespace NexusChat.Application.DTOs.ChatBot;

public sealed record MessageDataDto(
    string SenderName,
    string Content,
    DateTime CreatedAt,
    List<AttachmentBaseDto> Attachments,
    Guid? ParentMessageId);