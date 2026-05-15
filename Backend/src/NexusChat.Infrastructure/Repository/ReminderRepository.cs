using MongoDB.Driver;
using NexusChat.Application.Interfaces.ReminderInterface;
using NexusChat.Domain.Entity;
using NexusChat.Infrastructure.Data.Interface;
using NexusChat.Infrastructure.Repository.Common;

namespace NexusChat.Infrastructure.Repository;

public class ReminderRepository(IMongoDatabase mongoDatabase, IMongoUnitOfWork mongoUnitOfWork)
    : GenericRepository<Reminder, string>(mongoDatabase, mongoUnitOfWork), IReminderRepository
{
    public async Task<List<Reminder>> GetRemindersNotSentAsync(CancellationToken token)
    {
        var filter = Builders<Reminder>.Filter.Eq(x => x.IsSent, false) &
                     Builders<Reminder>.Filter.Lte(x => x.ExecuteAt, DateTime.UtcNow);
        var sort = Builders<Reminder>.Sort.Descending(x => x.ExecuteAt);
        var reminders = await DbSet.Find(filter).Sort(sort).Limit(20).ToListAsync(token);
        return reminders;
    }

    public Task UpdateListReminderAsync(List<string> reminderList, CancellationToken cancellationToken)
    {
        var filter = Builders<Reminder>.Filter.In(x => x.Id, reminderList);
        var update = Builders<Reminder>.Update.Set(x => x.IsSent, true);
        return DbSet.UpdateManyAsync(filter, update, cancellationToken: cancellationToken);
    }

    public async Task AddListReminderAsync(List<Reminder> reminderList, CancellationToken cancellationToken)
    {
        await DbSet.InsertManyAsync(reminderList, cancellationToken: cancellationToken);
    }
}