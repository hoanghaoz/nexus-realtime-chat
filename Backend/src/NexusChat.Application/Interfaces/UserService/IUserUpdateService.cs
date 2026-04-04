using ErrorOr;
using NexusChat.Application.DTOs.Users;

namespace NexusChat.Application.Interfaces.UserService;

public interface IUserUpdateService
{
    Task<ErrorOr<string>> UpdateUserAsync(string userId, UserUpdateDto dto,  CancellationToken token);
}