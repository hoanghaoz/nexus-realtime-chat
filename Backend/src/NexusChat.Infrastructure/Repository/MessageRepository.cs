using MongoDB.Driver;
using MongoDB.Driver.Linq;
using NexusChat.Application.DTOs.Hubs;
using NexusChat.Application.Interfaces;
using NexusChat.Domain.Entity;
using NexusChat.Infrastructure.Data.Interface;
using NexusChat.Infrastructure.Repository.Common;

namespace NexusChat.Infrastructure.Repository;

public class MessageRepository(
    IMongoDatabase mongoDatabase,
    IMongoUnitOfWork mongoUnitOfWork) 
    : GenericRepository<Message,string>(mongoDatabase, mongoUnitOfWork),IMessageRepository
{
    
    /// <summary>
    /// Apply Cursor Pagination to get message from conversation,
    /// if the cursor is null, it means that we are getting the latest messages,
    /// so we will order by createdAt descending and take 20 messages.
    /// Otherwise, we will get the messages that are created before the cursor and order by createdAt descending and take 20 messages.
    /// </summary>
    /// <param name="conversationId"></param>
    /// <param name="cursor"></param>
    /// <param name="token"></param>
    /// <returns></returns>
    public async Task<List<MessageDto>> GetMessageInConversationAsync(string conversationId, 
        DateTime? cursor, CancellationToken token)
    {
        var query = DbSet.AsQueryable();
        query = cursor == null ? query.Where(x => x.ConversationId.Equals(conversationId)) 
            : query.Where(x => x.ConversationId.Equals(conversationId) && x.CreatedAt < cursor);

        var response = await query
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new MessageDto(
                x.Id,
                x.FromUserId,
                x.Content,
                x.ConversationId,
                x.CreatedAt
            ))
            .Take(20)
            .ToListAsync(token);
        return response;
    }
}