namespace NexusChat.Application.DTOs.Message;

public sealed record MessageSearchRequestDto(
    string ConversationId,
    string Keyword,
    int Skip = 0,
    int Limit = 20);