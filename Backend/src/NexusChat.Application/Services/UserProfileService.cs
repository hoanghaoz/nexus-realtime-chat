using ErrorOr;
using NexusChat.Application.DTOs.Users;
using NexusChat.Application.Interfaces.UserRepository;
using NexusChat.Application.Interfaces.UserService;

namespace NexusChat.Application.Services;

public class UserProfileService(IUserRepository userRepository) : IUserProfileService
{
    public async Task<ErrorOr<UserProfileResponseDto>> GetUserProfileAsync(string userId, CancellationToken token)
    {
        var user = await userRepository.GetByIdAsync(userId, token);

        if (user == null)
        {
            return Error.NotFound("User.NotFound", $"Không tìm thấy người dùng với ID: {userId}");
        }

        return new UserProfileResponseDto
        {
            Id = user.Id,
            Username = user.UserName,
            Avatar = user.Avatar,
            Status = user.Status,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            FriendCount = user.Friends?.Count ?? 0
        };
    }
}