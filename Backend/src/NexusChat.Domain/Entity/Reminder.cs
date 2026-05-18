using NexusChat.Domain.Common;

namespace NexusChat.Domain.Entity;

public class Reminder : Entity<string>
{
    public required string ConversationId { get; set; }
    
    public required string Task { get; set; }
    
    public required DateTime ExecuteAt { get; set; }
    
    public List<string> MentionUserIds { get; set; } = [];
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsSent { get; set; } = false;
}