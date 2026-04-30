namespace NexusChat.Application.DTOs.Media;

public sealed record LinkPreviewRequestDto(string MessageId, string ConversationId, string Url);