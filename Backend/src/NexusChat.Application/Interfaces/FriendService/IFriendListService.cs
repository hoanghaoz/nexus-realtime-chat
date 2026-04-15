using ErrorOr;
using NexusChat.Application.DTOs;

namespace NexusChat.Application.Interfaces.FriendService;

public interface IFriendListService
{
    public Task<ErrorOr<List<FriendResponseDto>>> GetFriendsListAsync(string userId, CancellationToken token);
    public Task<ErrorOr<List<FriendResponseDto>>> SearchFriendsAsync(string userId, string keyword,
        CancellationToken token);
}