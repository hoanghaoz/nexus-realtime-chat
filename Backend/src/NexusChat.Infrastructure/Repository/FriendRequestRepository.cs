using MongoDB.Driver;
using NexusChat.Application.Interfaces.FriendRepository;
using NexusChat.Application.Interfaces.FriendRequests;
using NexusChat.Application.Interfaces.FriendService;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Enum;
using NexusChat.Infrastructure.Data.Interface;
using NexusChat.Infrastructure.Repository.Common;

namespace NexusChat.Infrastructure.Repository;

public class FriendRequestRepository(
    IMongoDatabase mongoDatabase,
    IMongoUnitOfWork mongoUnitOfWork) : GenericRepository<FriendRequest, string>(mongoDatabase, mongoUnitOfWork),
    IFriendRequestRepository
{

    public async Task<FriendRequest?> GetRequestBetweenUsersAsync(string userId1, string userId2, CancellationToken token)
    {
        return await DbSet.Find(req =>
                (req.FromUserId == userId1 && req.ToUserId == userId2) ||
                (req.FromUserId == userId2 && req.ToUserId == userId1))
            .FirstOrDefaultAsync(token);
    }

    public async Task<List<FriendRequest>> GetPendingRequestsForUserAsync(string userId, CancellationToken token)
    {
        return await DbSet.Find(req =>
                req.ToUserId == userId && req.RequestType == RequestType.Waiting)
            .SortByDescending(req => req.CreatedAt)
            .ToListAsync(token);
    }

    public async Task<FriendRequest?> GetRequestByIdAsync(string requestId, CancellationToken token)
    {
        return await DbSet.Find(req => req.Id == requestId && req.RequestType == RequestType.Waiting)
            .FirstOrDefaultAsync(token);
    }
}