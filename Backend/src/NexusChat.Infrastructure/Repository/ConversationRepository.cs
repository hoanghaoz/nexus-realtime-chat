using MongoDB.Driver;
using NexusChat.Application.Interfaces.RoomService;
using NexusChat.Domain.Entity;
using NexusChat.Infrastructure.Data.Interface;
using NexusChat.Infrastructure.Repository.Common;

namespace NexusChat.Infrastructure.Repository;

public class ConversationRepository(IMongoDatabase mongoDatabase, IMongoUnitOfWork mongoUnitOfWork)
    : GenericRepository<Conversation, string>(mongoDatabase, mongoUnitOfWork), IConversationRepository
{
}