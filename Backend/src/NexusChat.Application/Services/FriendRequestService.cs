using ErrorOr;
using NexusChat.Application.DTOs.FriendRequests;
using NexusChat.Application.Interfaces.FriendRequests;
using NexusChat.Application.Interfaces.UserRepository;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Enum;

namespace NexusChat.Application.Services;


public class FriendRequestService(IUserRepository userRepository,IFriendRequestRepository friendRequestRepository, INotificationService notificationService) : IFriendRequestService 
{
    public async Task<ErrorOr<string>> SendRequestAsync(string senderId, CreateFriendRequestDto createFriendRequest, CancellationToken token)
    {
        // Check send friend request to yourself 
        if (senderId == createFriendRequest.ToUserId)
            return Error.Validation("You cannot send a friend request to yourself.");
        // Check Existence of ReceiverId
        var receiver = await userRepository.GetByIdAsync(createFriendRequest.ToUserId, token);
        if (receiver is null)
        {
            return Error.NotFound($"The user with id {receiver?.Id} was not found.");
        }
        // Check Has Pending 
        var hasPending = await friendRequestRepository.HasPendingRequestAsync(senderId, receiver.Id, token);
        if (hasPending)
        {
            return Error.Conflict($"The user with id {receiver.Id} is already pending.");
        }
        // Create Request 
        var newRequest = new FriendRequest
        {
            Id = Guid.NewGuid().ToString(),
            FromUserId = senderId,
            ToUserId = receiver.Id,
        };
        
        await friendRequestRepository.AddAsync(newRequest, token);
        
        var sender = await userRepository.GetByIdAsync(senderId, token);
        if (sender != null)
        {
            var notification = new FriendRequestDto(
                newRequest.Id,
                senderId,
                sender.UserName ?? "Unknown",
                sender.Avatar ?? "" ,
                newRequest.CreatedAt
            );
            await notificationService.SendFriendRequestNotificationAsync(receiver.Id, notification, token);
        }
        return "Sent add friend request successfully";
    }
    
    public async Task<ErrorOr<string>> AcceptRequestAsync(string requestId, string toUserId, CancellationToken token)
    {
        // Find FriendRequest with status is pending
        var request = await friendRequestRepository.GetRequestByIdAsync(requestId, token);
        var receiver  = await userRepository.GetByIdAsync(toUserId, token);
        if (request is null)
        {
            return Error.NotFound("The request was not found.");
        }
        // Security: Check whether this request actually belongs to the user who is attempting to accept it
        if (request.ToUserId != toUserId)
        {
            return Error.Validation("You are not authorized to accept someone else's invitation!"); 
        }

        request.RequestType = RequestType.Accept;
        await friendRequestRepository.UpdateAsync(request, token);
        // Add sender into List Friend receiver
        var sender =  await userRepository.GetByIdAsync(request.FromUserId, token);
        return "Friend request accepted successfully";
    }

    public async Task<ErrorOr<string>> DeclineRequestAsync(string requestId, string toUserId, CancellationToken token)
    {
        // Find FriendRequest with status is pending
        var request = await friendRequestRepository.GetRequestByIdAsync(requestId, token);
        if (request is null)
        {
            return Error.NotFound("The request was not found.");
        }
        // Security: Check whether this request actually belongs to the user who is attempting to accept it
        if (request.ToUserId != toUserId)
        {
            return Error.Validation("You are not authorized to reject someone else's invitation!"); 
        }

        request.RequestType = RequestType.Reject;
        await friendRequestRepository.UpdateAsync(request, token);
        return "Friend request  rejected successfully";
    }

    public async Task<ErrorOr<List<FriendRequestDto>>> GetPendingRequestsAsync(string userId, CancellationToken token)
    {
        // Get all request pending of this user 
        var pendingRequest = await friendRequestRepository.GetPendingRequestsForUserAsync(userId, token);

        var result = new List<FriendRequestDto>();
        foreach (var req in pendingRequest)
        {
            var sender = await userRepository.GetByIdAsync(req.FromUserId, token);
            result.Add(new FriendRequestDto(
                req.Id,
                req.FromUserId,
                sender?.UserName ?? "Unknown",
                sender?.Avatar ?? "",
                req.CreatedAt
                ));
        }

        return result;
    }
}

