using MongoDB.Driver;
using NexusChat.Infrastructure.Data.Interface;

namespace NexusChat.Infrastructure.Repository.Common;

public class UnitOfWork(IMongoClient mongoClient) : IMongoUnitOfWork
{
    public IClientSessionHandle? SessionHandle { get; set; }
    /// <summary>
    /// Dispose to free the resource after a session
    /// </summary>
    public void Dispose()
    {
        SessionHandle?.Dispose();
        GC.SuppressFinalize(this);
    }

    public async Task BeginTransactionAsync(CancellationToken token = default)
    {
        SessionHandle = await mongoClient.StartSessionAsync(cancellationToken: token);
        SessionHandle.StartTransaction();
    }

    public async Task CommitTransactionAsync(CancellationToken token = default)
    {
        if (SessionHandle is { IsInTransaction: true })
        {
            await SessionHandle.CommitTransactionAsync(cancellationToken: token);
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken token = default)
    {
        if(SessionHandle is { IsInTransaction: true })
        {
            await SessionHandle.AbortTransactionAsync(cancellationToken: token);
        }
    }
}