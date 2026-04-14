namespace NexusChat.Application.DTOs.Message;

public sealed record ReactMessageRequestDto(string Emoji, bool IsReacted = true);