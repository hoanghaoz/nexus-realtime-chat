using NexusChat.Application.Interfaces.Common;
using NexusChat.Domain.Entity;

namespace NexusChat.Application.Interfaces.RoomService;

public interface IConversationRepository : IGenericRepository<Conversation, string>
{
}