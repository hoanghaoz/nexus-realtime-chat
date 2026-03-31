using ErrorOr;
using NexusChat.Application.DTOs.Users;

namespace NexusChat.Application.Interfaces;

public interface IUserUpdateService
{
    Task<ErrorOr<string>> UpdateUserAsync(string userId, UserUpdateDto dto,  CancellationToken token);
}