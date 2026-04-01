using NexusChat.Application.Interfaces.Common;
using NexusChat.Domain.Entity;
namespace NexusChat.Application.Interfaces.FriendRequests;

public interface IFriendRequestRepository : IGenericRepository<FriendRequest, string>
{
    Task<bool> HasPendingRequestAsync(string senderId, string receiverId, CancellationToken token);
    Task<bool> HasAnyRequestBetweenAsync(string userId1, string userId2);
    Task<List<FriendRequest>> GetPendingRequestsForUserAsync(string userId);
    Task<FriendRequest?> GetRequestByIdAsync(string requestId);
}