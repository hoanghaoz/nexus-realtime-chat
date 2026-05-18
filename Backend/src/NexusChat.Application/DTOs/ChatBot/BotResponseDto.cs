namespace NexusChat.Application.DTOs.ChatBot;

public sealed record BotResponseDto(
    string MessageId,
    string? ParentMessageId,
    string ConversationId,
    string? Content,
    DateTime? ReplyAt,
    DateTime? SendAt);