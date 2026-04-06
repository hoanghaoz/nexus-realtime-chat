using NexusChat.Domain.Common;
using NexusChat.Domain.Entity.EmbeddedObject;

namespace NexusChat.Domain.Entity;

public class Message : Entity<string>
{
    public required string ConversationId { get; set; }
    public required string FromUserId { get; set; }
    public string? Content { get; set; }
    
    public List<Attachment> Attachments { get; set; } = [];
    
    public List<Reaction> Reactions { get; set; } = [];

    public bool IsDeleted { get; set; } = false;
    
    public DateTime? DeletedAt { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}