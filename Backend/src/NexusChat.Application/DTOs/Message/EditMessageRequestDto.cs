namespace NexusChat.Application.DTOs.Message;

public sealed record EditMessageRequestDto(string MessageId,string NewContent,bool IsEdited);