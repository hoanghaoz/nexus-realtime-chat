namespace NexusChat.Application.DTOs.Message;

public sealed record MessageThreadResponseDto(
    MessageResponseDto OriginalMessage,
    List<MessageResponseDto> Replies);