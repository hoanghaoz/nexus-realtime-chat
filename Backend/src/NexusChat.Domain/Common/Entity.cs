namespace NexusChat.Domain.Common;

public abstract class Entity<TEntityId>
{
    public TEntityId Id { get; init; } = default!;
}