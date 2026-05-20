namespace NexusChat.Application.DTOs.Message;

public sealed record MessageResponseDto(
    string MessageId,
    string UserId,
    string? Content,
    string ConversationId,
    DateTime CreatedAt,
    List<AttachmentBaseDto> Attachments,
    List<ReactionDto> Reactions,
    List<string> MentionUser,
    bool IsDeleted,
    bool IsEdited,
    bool IsPending,
    string? ReplyToMessageId,
    DateTime? ReplyAt,
    DateTime? DeletedAt,
    DateTime? EditedAt);
