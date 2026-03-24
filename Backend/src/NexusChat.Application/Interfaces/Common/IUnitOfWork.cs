namespace NexusChat.Application.Interfaces.Common;

public interface IUnitOfWork : IDisposable
{
    Task BeginTransactionAsync(CancellationToken token = default);
    Task CommitTransactionAsync(CancellationToken token = default);
    Task RollbackTransactionAsync(CancellationToken token = default);
}