using NexusChat.Domain.Common;
using NexusChat.Domain.Entity.EmbeddedObject;
using NexusChat.Domain.Enum;

namespace NexusChat.Domain.Entity;

public class Conversation : Entity<string>
{
    public RoomType RoomType { get; set; }
    
    public required string Name { get; set; }
    
    public required string CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; }

    public List<Participant> Participants { get; set; } = [];
    
    // display the last message in group
    public LastMessage? LastMessage { get; set; }
    
    // count unread messages and display 
    public Dictionary<string,int> UnreadMessages { get; set; } = new();
}