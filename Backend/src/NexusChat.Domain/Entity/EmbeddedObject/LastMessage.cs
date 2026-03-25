namespace NexusChat.Domain.Entity.EmbeddedObject;

public sealed record class LastMessage
{
    public string? Content { get; set; }
    public string? SenderId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}