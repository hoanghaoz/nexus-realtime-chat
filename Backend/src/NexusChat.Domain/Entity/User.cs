using NexusChat.Domain.Common;
using NexusChat.Domain.Enum;

namespace NexusChat.Domain.Entity;

public class User : Entity<string>
{
    public required string UserName { get; set; }
    public required string Password { get; set; }
    public string? Avatar { get; set; }
    public UserStatus Status { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; }
    
    // List contains other UserId who is friend with this user
    public List<string> Friends { get; set; } = [];
}