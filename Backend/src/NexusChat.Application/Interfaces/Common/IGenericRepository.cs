using NexusChat.Domain.Common;

namespace NexusChat.Application.Interfaces.Common;

public interface IGenericRepository<TEntity,TEntityId> where TEntity : Entity<TEntityId>
{
    Task AddAsync(TEntity entity, CancellationToken token);
    
    Task UpdateAsync(TEntity entity,CancellationToken token);
    
    Task DeleteAsync(TEntity entity,CancellationToken token);
    
    Task<TEntity?> GetByIdAsync(TEntityId id,CancellationToken cancellationToken);
}