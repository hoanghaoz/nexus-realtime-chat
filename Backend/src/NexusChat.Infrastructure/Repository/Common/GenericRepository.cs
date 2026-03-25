using MongoDB.Driver;
using NexusChat.Application.Interfaces.Common;
using NexusChat.Domain.Common;
using NexusChat.Infrastructure.Data.Interface;

namespace NexusChat.Infrastructure.Repository.Common;

public abstract class GenericRepository<TEntity,TEntityId>(
     IMongoDatabase mongoDatabase,
     IMongoUnitOfWork mongoUnitOfWork) : IGenericRepository<TEntity,TEntityId>
     where TEntity : Entity<TEntityId>
{
     protected readonly IMongoCollection<TEntity> DbSet = mongoDatabase.GetCollection<TEntity>(typeof(TEntity).Name);
     public async Task AddAsync(TEntity entity, CancellationToken token)
     {
          // if the session handle is not null, it means that we are in a transaction, so we need to use the session handle to perform the operation
          // same in UpdateAsync, DeleteAsync
         if(mongoUnitOfWork.SessionHandle is not null)
         {
             await DbSet.InsertOneAsync(mongoUnitOfWork.SessionHandle, entity, cancellationToken: token);
         }
         else
         {
             await DbSet.InsertOneAsync(entity, cancellationToken: token);
         }
     }

     public async Task UpdateAsync(TEntity entity, CancellationToken token)
     {
          if (mongoUnitOfWork.SessionHandle is not null)
          {
               await DbSet.ReplaceOneAsync(mongoUnitOfWork.SessionHandle,
                    x => x.Id!.Equals(entity.Id),
                    entity,cancellationToken: token);
          }
          else
          {
               await DbSet.ReplaceOneAsync(
                    x => x.Id!.Equals(entity.Id),
                    entity,cancellationToken: token);
          }
     }

     public async Task DeleteAsync(TEntity entity,CancellationToken token)
     {
          if (mongoUnitOfWork.SessionHandle is not null)
          {
               await DbSet.DeleteOneAsync(mongoUnitOfWork.SessionHandle,x => x.Id!.Equals(entity.Id), cancellationToken: token);
          }
          else
          {
               await DbSet.DeleteOneAsync(x => x.Id!.Equals(entity.Id), cancellationToken: token);
          }
     }

     public async Task<TEntity?> GetByIdAsync(TEntityId id, CancellationToken token)
     {
          var cursor = await DbSet.FindAsync(x => x.Id!.Equals(id), cancellationToken: token);
          return await cursor.FirstOrDefaultAsync(token);
     }
}