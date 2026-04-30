namespace NexusChat.Application.DTOs.Message;

public sealed record SendMessageRequestDto(
    string ConversationId,
    string? Content,
    List<AttachmentBaseDto>? Attachments,
    List<string>? MentionedUsersId);