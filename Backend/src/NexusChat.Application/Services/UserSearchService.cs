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
            return new List<UserSearchResponseDto>(); // Nếu search rỗng thì trả về mảng rỗng
        }

        var users = await userRepository.SearchUsersByNameAsync(name, token);

        var result = users.Select(u => new UserSearchResponseDto(
            u.Id,
            u.UserName,
            u.Avatar,
            u.Status
        )).ToList();

        return result;
    }
}