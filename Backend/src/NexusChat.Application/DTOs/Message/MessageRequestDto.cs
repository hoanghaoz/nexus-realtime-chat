namespace NexusChat.Application.DTOs.Message;

public sealed record MessageRequestDto(string ConversationId,DateTime? Cursor);