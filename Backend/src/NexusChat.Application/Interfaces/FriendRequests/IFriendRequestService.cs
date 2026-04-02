using ErrorOr;
using NexusChat.Application.DTOs.Hubs;

namespace NexusChat.Application.Interfaces.FriendRequests;

public interface IFriendRequestService
{
    Task<ErrorOr<string>> SendRequestAsync(string senderId, string receiverId, CancellationToken token);
    Task<ErrorOr<string>> AcceptRequestAsync(string requestId, string receiverId, CancellationToken token);
    Task<ErrorOr<string>> DeclineRequestAsync(string requestId, string receiverId, CancellationToken token);
    Task<ErrorOr<List<FriendRequestDto>>> GetPendingRequestsAsync(string userId, CancellationToken token);
}