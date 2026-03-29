namespace NexusChat.Application.DTOs.Hubs;

public sealed record MessageDto(string MessageId,string UserId,string? Content ,string ConversationId,DateTime CreatedAt);