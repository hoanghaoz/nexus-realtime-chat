using ErrorOr;
using NexusChat.Application.DTOs;
using NexusChat.Application.Interfaces.FriendService;
using NexusChat.Application.Interfaces.Hubs;
using NexusChat.Application.Interfaces.UserRepository;

namespace NexusChat.Application.Services;

public class FriendListService(IUserRepository userRepository, IPresenceTracker presenceTracker) : IFriendListService
{

    public async Task<ErrorOr<List<FriendResponseDto>>> GetFriendsListAsync(string userId, CancellationToken token)
    {
        var user = await userRepository.GetByIdAsync(userId, token);
        if (user is null)
        {
            return Error.NotFound("FriendList.UserNotFound", "User was not found.");
        }

        // 1. Fetch friends list from database
        var friendsFromDb = await userRepository.GetFriendsByUserIdAsync(userId, token);

        if (friendsFromDb.Count == 0) return new List<FriendResponseDto>();

        // 2. Get list of currently online users from the presence tracker (in-memory cache)
        var onlineUserIds = await presenceTracker.GetOnlineUsers();

        // 3. Map to DTOs and mark friends as online/offline based on presence tracker
        var response = friendsFromDb.Select(f => new FriendResponseDto(
            f.Id,
            f.UserName,
            f.Avatar,
            IsOnline: onlineUserIds.Contains(f.Id) // Check if friend is currently online
        )).ToList();

        return response;
    }

    public async Task<ErrorOr<List<FriendResponseDto>>> SearchFriendsAsync(string userId, string keyword,
        CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(keyword))
        {
            return Error.Validation("FriendList.InvalidKeyword", "Keyword is required.");
        }

        var friends = await GetFriendsListAsync(userId, token);
        if (friends.IsError)
        {
            return friends.Errors;
        }

        return friends
            .Value
            .Where(friend => friend.UserName.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }
}