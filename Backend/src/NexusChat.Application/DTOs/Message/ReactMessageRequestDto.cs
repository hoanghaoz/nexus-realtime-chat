namespace NexusChat.Application.DTOs.Message;

public sealed record ReactMessageRequestDto(string MessageId,string Emoji,bool IsReacted = true);