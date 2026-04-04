using ErrorOr;
using NexusChat.Application.DTOs.FriendRequests;
using NexusChat.Application.DTOs.Hubs;

namespace NexusChat.Application.Interfaces.FriendRequests;

public interface IFriendRequestService
{
    Task<ErrorOr<string>> SendRequestAsync(string senderId, CreateFriendRequestDto createFriendRequest, CancellationToken token);
    Task<ErrorOr<string>> AcceptRequestAsync(string requestId, string toUserId, CancellationToken token);
    Task<ErrorOr<string>> DeclineRequestAsync(string requestId, string toUserId,  CancellationToken token);
    Task<ErrorOr<List<FriendRequestDto>> > GetPendingRequestsAsync(string userId, CancellationToken token);
}