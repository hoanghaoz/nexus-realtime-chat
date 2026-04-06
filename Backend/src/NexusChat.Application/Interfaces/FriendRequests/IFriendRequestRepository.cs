using NexusChat.Application.Interfaces.Common;
using NexusChat.Domain.Entity;
namespace NexusChat.Application.Interfaces.FriendRequests;

public interface IFriendRequestRepository : IGenericRepository<FriendRequest, string>
{
    Task<FriendRequest?> GetRequestBetweenUsersAsync(string userId1, string userId2, CancellationToken token);
    Task<List<FriendRequest>> GetPendingRequestsForUserAsync(string userId, CancellationToken token);
    Task<FriendRequest?> GetRequestByIdAsync(string requestId, CancellationToken token);
}