using ErrorOr;
using NexusChat.Application.DTOs.Users;

namespace NexusChat.Application.Interfaces.UserService;

public interface IUserProfileService
{
    Task<ErrorOr<UserProfileResponseDto>> GetUserProfileAsync(string userId, CancellationToken token);
}