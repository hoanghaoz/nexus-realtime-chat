using MongoDB.Driver;
using NexusChat.Application.Interfaces.ConversationRepository;
using NexusChat.Domain.Entity;
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

    public async Task<bool> IsUserInConversationAsync(string conversationId, string userId, CancellationToken token)
    {
        return await DbSet.FindAsync(c => c.Id == conversationId && c.Participants.Any(p => p.UserId == userId),
                cancellationToken: token)
            .Result.AnyAsync(token);
    }

    public async Task<Conversation?> FindDirectConversationAsync(string userId1, string userId2, CancellationToken token)
    {
        // Find a conversation that is RoomType.Direct and contains BOTH users
        var filter = Builders<Conversation>.Filter.And(
            Builders<Conversation>.Filter.Eq(c => c.RoomType, NexusChat.Domain.Enum.RoomType.Direct),
            Builders<Conversation>.Filter.ElemMatch(c => c.Participants, p => p.UserId == userId1),
            Builders<Conversation>.Filter.ElemMatch(c => c.Participants, p => p.UserId == userId2)
        );
        var cursor = await DbSet.FindAsync(filter, cancellationToken: token);
        return await cursor.FirstOrDefaultAsync(token);
    }
}