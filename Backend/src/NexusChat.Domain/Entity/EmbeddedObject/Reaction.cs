namespace NexusChat.Domain.Entity.EmbeddedObject;

public class Reaction
{
    public required string FromUserId { get; set; }
    public required string Emoji { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}