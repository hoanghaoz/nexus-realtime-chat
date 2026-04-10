namespace NexusChat.Application.DTOs.Message;

public sealed record SendMessageRequestDto(string ConversationId,string? Content,List<AttachmentDto>? Attachments,
    List<string>? MentionedUsersId);