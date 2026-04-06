using ErrorOr;
using NexusChat.Application.DTOs.Users;

namespace NexusChat.Application.Interfaces.UserService;

public interface IUserSearchService
{
    Task<ErrorOr<List<UserSearchResponseDto>>> SearchUsersByNameAsync(string name, CancellationToken token);
}