namespace NexusChat.Application.DTOs.Message;

public sealed record Cursor(string? MessageId, DateTime? CreatedAt);