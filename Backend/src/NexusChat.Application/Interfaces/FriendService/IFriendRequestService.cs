using ErrorOr;
using NexusChat.Application.DTOs.FriendRequests;

namespace NexusChat.Application.Interfaces.FriendService;

public interface IFriendRequestService
{
    Task<ErrorOr<string>> CheckFriendshipStatusAsync(string senderId, string receiverId, CancellationToken token);
    Task<ErrorOr<string>> SendRequestAsync(string senderId, CreateFriendRequestDto createFriendRequest, CancellationToken token);
    Task<ErrorOr<string>> AcceptRequestAsync(string requestId, string toUserId, CancellationToken token);
    Task<ErrorOr<string>> DeclineRequestAsync(string requestId, string toUserId,  CancellationToken token);
    Task<ErrorOr<List<FriendRequestDto>> > GetPendingRequestsAsync(string userId, CancellationToken token);
}