using ErrorOr;
using NexusChat.Application.DTOs.Users;
using NexusChat.Application.Interfaces.UserRepository;
using NexusChat.Application.Interfaces.UserService;

namespace NexusChat.Application.Services;

public class UserSearchService(IUserRepository userRepository) : IUserSearchService
{
    public async Task<ErrorOr<List<UserSearchResponseDto>>> SearchUsersByNameAsync(string name, CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return new List<UserSearchResponseDto>();
        }

        var users = await userRepository.SearchUsersByNameAsync(name, token);

        if (users == null || users.Count == 0)
        {
            return Error.NotFound(
                code: "UserSearch.NotFound",
                description: "Không tìm thấy user nào phù hợp với tên này."
            );
        }

        var result = users.Select(u => new UserSearchResponseDto(
            u.Id,
            u.UserName,
            u.Avatar,
            u.Status
        )).ToList();

        return result;
    }
}