namespace NexusChat.Application.Interfaces.Common;

public interface IUnitOfWork
{
    Task SaveChangesAsync(CancellationToken token = default);
}