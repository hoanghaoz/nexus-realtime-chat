using MongoDB.Bson;
using MongoDB.Driver;
using NexusChat.Application.DTOs;
using NexusChat.Application.Interfaces.UserRepository;
using NexusChat.Domain.Entity;
using NexusChat.Infrastructure.Data.Interface;
using NexusChat.Infrastructure.Repository.Common;

namespace NexusChat.Infrastructure.Repository;

public class UserRepository(
    IMongoDatabase mongoDatabase,
    IMongoUnitOfWork mongoUnitOfWork) : GenericRepository<User,string>(mongoDatabase,mongoUnitOfWork), IUserRepository
{
    public async Task<bool> IsUsernameExistsAsync(string username,CancellationToken token)
    {
        return await DbSet.Find(us => us.UserName == username).AnyAsync(token);
    }

    public async Task<User?> GetUserByUsernameAsync(string username, CancellationToken token)
    {
        return await DbSet.Find(us => us.UserName == username).FirstOrDefaultAsync(token);
    }

    public async Task<List<FriendDto>> GetFriendsWithUserAsync(string username,CancellationToken token)
    {
        var user = await GetUserByUsernameAsync(username,token);
        if (user?.Friends == null || !user.Friends.Any())
        {
            return [];
        }
        var friends = await DbSet.Find(us => user.Friends.Contains(us.Id)).ToListAsync(token);
        return friends.Select(f => new FriendDto(
                f.Id, 
                f.UserName, 
                f.Avatar, 
                f.Status
            )).ToList();
    }

    public async Task<List<User>> SearchUsersByNameAsync(string name, CancellationToken token)
    {
        var filter = Builders<User>.Filter.Regex(u => u.UserName, new BsonRegularExpression(name, "i"));
        return await DbSet.Find(filter).ToListAsync(token);
    }
}