using NexusChat.Domain.Enum;

namespace NexusChat.Domain.Entity.EmbeddedObject;

public sealed record Participant
{
    public required string UserId { get; set; }
    public required ParticipantRole Role { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}