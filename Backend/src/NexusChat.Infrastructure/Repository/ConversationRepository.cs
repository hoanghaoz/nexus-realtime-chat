using MongoDB.Driver;
using NexusChat.Application.DTOs.Conversation;
using NexusChat.Application.Interfaces.ConversationRepository;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Enum;
using NexusChat.Infrastructure.Data.Interface;
using NexusChat.Infrastructure.Repository.Common;
namespace NexusChat.Infrastructure.Repository;

public class ConversationRepository( 
    IMongoDatabase mongoDatabase,
    IMongoUnitOfWork mongoUnitOfWork) : GenericRepository<Conversation, string>(mongoDatabase, mongoUnitOfWork),
    IConversationRepository
{
        public async Task<List<Conversation>> GetUserConversationsAsync(string userId, CancellationToken token)
        {
            var filter = Builders<Conversation>.Filter.AnyEq(c => c.Participants.Select(b => b.UserId), userId);
            var sort = Builders<Conversation>.Sort.Descending(c => c.LastMessage!.CreatedAt);
            var cursor = await DbSet.FindAsync(filter, new FindOptions<Conversation> { Sort = sort }, token);
            return await cursor.ToListAsync(token);
        }
}