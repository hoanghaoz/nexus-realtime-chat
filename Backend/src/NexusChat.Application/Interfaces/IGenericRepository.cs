using NexusChat.Domain.Common;

namespace NexusChat.Application.Interfaces;

public interface IGenericRepository<TEntity,TEntityId> where TEntity : Entity<TEntityId>
{
    void Add(TEntity entity);
    
    void Update(TEntity entity);
    
    void Delete(TEntity entity);
    
    Task<TEntity?> GetByIdAsync(TEntityId id,CancellationToken cancellationToken);
}