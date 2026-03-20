using NexusChat.Application.Interfaces;
using NexusChat.Infrastructure.Data;

namespace NexusChat.Infrastructure.Repository;

public class UnitOfWork(AppDbContext context) : IUnitOfWork
{
    public async Task SaveChangesAsync(CancellationToken token)
    {
        await context.SaveChangesAsync(token);
    }
}