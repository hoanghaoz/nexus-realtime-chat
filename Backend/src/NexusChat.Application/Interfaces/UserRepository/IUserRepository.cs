using NexusChat.Application.DTOs;
using NexusChat.Application.Interfaces.Common;
using NexusChat.Domain.Entity;

namespace NexusChat.Application.Interfaces.UserRepository;

public interface IUserRepository : IGenericRepository<User,string>
{
    Task<bool> IsUsernameExistsAsync(string username, CancellationToken token);
    
    Task<User?> GetUserByUsernameAsync(string username, CancellationToken token);
    
    Task<List<FriendDto>> GetFriendsWithUserAsync(string username, CancellationToken token);
}