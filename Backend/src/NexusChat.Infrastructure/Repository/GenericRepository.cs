using Microsoft.EntityFrameworkCore;
using NexusChat.Application.Interfaces;
using NexusChat.Domain.Common;
using NexusChat.Infrastructure.Data;

namespace NexusChat.Infrastructure.Repository;

public abstract class GenericRepository<TEntity,TEntityId>(AppDbContext context) 
     : IGenericRepository<TEntity,TEntityId>
     where TEntity : Entity<TEntityId>
{
     protected readonly DbSet<TEntity> DbSet = context.Set<TEntity>();
     public void Add(TEntity entity)
     {
          DbSet.Add(entity);
     }

     public void Update(TEntity entity)
     {
          DbSet.Update(entity);
     }

     public void Delete(TEntity entity)
     {
          DbSet.Remove(entity);
     }

     public async Task<TEntity?> GetByIdAsync(TEntityId id, CancellationToken cancellationToken)
     {
          return await DbSet.AsNoTracking().FirstOrDefaultAsync(x => x.Id!.Equals(id), cancellationToken);
     }
}