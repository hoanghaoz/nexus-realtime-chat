using MongoDB.Bson;
using MongoDB.Driver;
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
    
    public async Task<List<User>> GetFriendsByUserIdAsync(string userId,CancellationToken token)
    {
        var user = await GetByIdAsync(userId, token);
        if (user?.Friends == null || user.Friends.Count == 0)
        {
            return [];
        }
        return await DbSet.Find(us => user.Friends.Contains(us.Id)).ToListAsync(token);
    }

    public async Task<List<User>> SearchUsersByNameAsync(string name, CancellationToken token)
    {
        var filter = Builders<User>.Filter.Regex(u => u.UserName, new BsonRegularExpression(name, "i"));
        return await DbSet.Find(filter).ToListAsync(token);
    }

    public async Task<Dictionary<string,User>> GetListUserAsync(List<string> userIds, CancellationToken token)
    {
        if (userIds.Count == 0)
        {
            return new Dictionary<string, User>();
        }
        var filter = Builders<User>.Filter.In(u => u.Id, userIds);
        var users = await DbSet.Find(filter).ToListAsync(token);
        return users.ToDictionary(u => u.Id);
    }

    public async Task<List<User>> GetUsersByIdsAsync(IEnumerable<string> userIds, CancellationToken token)
    {
        var enumerable = userIds.ToList();
        if (enumerable.Count == 0)
        {
            return []; 
        }
        var filter = Builders<User>.Filter.In(u => u.Id, enumerable);
        return await DbSet.Find(filter).ToListAsync(token);
    }
}