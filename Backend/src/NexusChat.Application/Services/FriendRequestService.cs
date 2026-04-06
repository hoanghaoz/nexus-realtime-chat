using ErrorOr;
using NexusChat.Application.DTOs.FriendRequests;
using NexusChat.Application.Interfaces.FriendRequests;
using NexusChat.Application.Interfaces.UserRepository;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Enum;

namespace NexusChat.Application.Services;

public class FriendRequestService(IUserRepository userRepository,IFriendRequestRepository friendRequestRepository, INotificationService notificationService) : IFriendRequestService 
{
    public async Task<ErrorOr<string>> CheckFriendshipStatusAsync(string senderId, string receiverId, CancellationToken token)
    {
        // Prevent users from checking friendship status with themselves
        if (senderId == receiverId)
        {
            return Error.Validation(description: "Cannot check friendship status with yourself.");
        }

        // Fast path: Check the Friends array first for existing friendship
        var currentUser = await userRepository.GetByIdAsync(senderId, token);
        if (currentUser != null && currentUser.Friends.Contains(receiverId))
        {
            return "Friend";
        }

        // Slow path: Fetch the request history between these two users
        var request = await friendRequestRepository.GetRequestBetweenUsersAsync(senderId, receiverId, token);

        // Evaluate the request type and map it to the corresponding UI status
        return request?.RequestType switch
        {
            RequestType.Waiting => "Pending",
            RequestType.Reject => "None",
            RequestType.Accept => "Friend",
            _ => "None"
        };
    }


    public async Task<ErrorOr<string>> SendRequestAsync(string senderId, CreateFriendRequestDto createFriendRequest, CancellationToken token)
    {
        // Check send friend request to yourself 
        if (senderId == createFriendRequest.ToUserId)
            return Error.Validation(description: "Cannot send request to with yourself.");
        
        // Check Existence of ReceiverId and SenderId
        var sender = await userRepository.GetByIdAsync(senderId, token);
        var receiver = await userRepository.GetByIdAsync(createFriendRequest.ToUserId, token);
        if (receiver == null || sender == null)
            return Error.NotFound(description: "The user you are trying to send a friend request to does not exist.");
        
        // Check whether sender and receiver are friends
        if (sender.Friends.Contains(receiver.Id))
            return Error.Conflict(description:"You are already friends with this user.");
        
        // Check Has Pending 
        var oldRequest = await friendRequestRepository.GetRequestBetweenUsersAsync(senderId, receiver.Id, token);
        string activeRequestId;
        if (oldRequest != null)
        {
            // If already pending, block the action
            if (oldRequest.RequestType == RequestType.Waiting)
                return Error.Conflict(description:$"The friend request to user with id {receiver.Id} is already pending.");

            // If rejected, enforce a 7-day cooldown period
            if (oldRequest.RequestType == RequestType.Reject)
            {
                // Fallback to CreatedAt if UpdatedAt is not set/available
                var cooldownTime = oldRequest.CreatedAt.AddMinutes(5); 
                
                if (DateTime.UtcNow < cooldownTime)
                {
                    var timeLeft = cooldownTime - DateTime.UtcNow;
                    return Error.Validation(description:$"Your previous request was rejected. Please try again in {timeLeft.Minutes} minutes and {timeLeft.Seconds} seconds.");
                }

                // Passed the cooldown: Reset the existing request to Pending
                oldRequest.RequestType = RequestType.Waiting;
                // oldRequest.UpdatedAt = DateTime.UtcNow; // Uncomment if you added UpdatedAt to FriendRequest entity
                
                await friendRequestRepository.UpdateAsync(oldRequest, token);
                activeRequestId = oldRequest.Id;
            }
            else
            {
                return Error.Conflict(description:"Invalid friend request state.");
            }
        }
        else
        {
            // Create Request (No prior history found)
            var newRequest = new FriendRequest
            {
                Id = Guid.NewGuid().ToString(),
                FromUserId = senderId,
                ToUserId = receiver.Id,
                RequestType = RequestType.Waiting, // Explicitly set status
                CreatedAt = DateTime.UtcNow
            };
            
            await friendRequestRepository.AddAsync(newRequest, token);
            activeRequestId = newRequest.Id;
        }
        
        // Send Notification using the active request ID (either new or updated)
        var notification = new FriendRequestDto(
            activeRequestId,
            senderId,
            sender.UserName,
            sender.Avatar ?? "",
            DateTime.UtcNow
        );
        await notificationService.SendFriendRequestNotificationAsync(receiver.Id, notification, token);
        
        return "Sent add friend request successfully";
    }
    
    public async Task<ErrorOr<string>> AcceptRequestAsync(string requestId, string toUserId, CancellationToken token)
    {
        // Find FriendRequest with status is pending
        var request = await friendRequestRepository.GetRequestByIdAsync(requestId, token);
        if (request is null)
        {
            return Error.NotFound(description:"The request was not found.");
        }
        // Security: Check whether this request actually belongs to the user who is attempting to accept it
        if (request.ToUserId != toUserId)
        {
            return Error.Validation(description:"You are not authorized to accept someone else's invitation!"); 
        }
        request.RequestType = RequestType.Accept;
        await friendRequestRepository.UpdateAsync(request, token);
        
        // Add sender into List Friend receiver
        var sender = await userRepository.GetByIdAsync(request.FromUserId, token);
        var receiver = await userRepository.GetByIdAsync(toUserId, token);

        if (sender != null && receiver != null)
        {
            if (!sender.Friends.Contains(receiver.Id))
            {
                sender.Friends.Add(receiver.Id);
                await userRepository.UpdateAsync(sender, token);
            }
            if (!receiver.Friends.Contains(sender.Id))
            {
                receiver.Friends.Add(sender.Id);
                await userRepository.UpdateAsync(receiver, token);
            }
            var acceptNotification = new AcceptFriendNotificationDto(
                receiver.Id,
                receiver.UserName,
                receiver.Avatar ?? "",
                DateTime.UtcNow
            );
            // Notify the original sender that their request was accepted
            await notificationService.SendAcceptFriendNotificationAsync(sender.Id, acceptNotification, token);  
        }
        return "Friend request accepted successfully";
    }

    public async Task<ErrorOr<string>> DeclineRequestAsync(string requestId, string toUserId, CancellationToken token)
    {
        // Find FriendRequest with status is pending
        var request = await friendRequestRepository.GetRequestByIdAsync(requestId, token);
        if (request is null)
        {
            return Error.NotFound(description:"The request was not found.");
        }
        // Security: Check whether this request actually belongs to the user who is attempting to accept it
        if (request.ToUserId != toUserId)
        {
            return Error.Validation(description:"You are not authorized to reject someone else's invitation!"); 
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

