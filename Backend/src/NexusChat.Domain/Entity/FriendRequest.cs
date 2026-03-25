using NexusChat.Domain.Common;
using NexusChat.Domain.Enum;

namespace NexusChat.Domain.Entity;

public class FriendRequest : Entity<string>
{
    public required string FromUserId { get; set; }
    public required string ToUserId { get; set; }
    public RequestType RequestType { get; set; } = RequestType.Waiting;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}