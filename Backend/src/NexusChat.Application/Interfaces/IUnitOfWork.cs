namespace NexusChat.Application.Interfaces;

public interface IUnitOfWork
{
    Task SaveChangesAsync(CancellationToken token = default);
}