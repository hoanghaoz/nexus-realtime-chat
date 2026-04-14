namespace NexusChat.Application.DTOs.Message;

public sealed record MessageResponseDto(string MessageId,string UserId,string? Content ,string ConversationId,DateTime CreatedAt,
    List<AttachmentDto> Attachments,List<ReactionDto> Reactions,bool IsDeleted,bool IsEdited,DateTime? DeletedAt,
    DateTime? EditedAt);