namespace NexusChat.Application.DTOs.Message;

public sealed record EditMessageRequestDto(string NewContent,bool IsEdited);