using NexusChat.Application.Interfaces.Common;
using NexusChat.Domain.Entity;

namespace NexusChat.Application.Interfaces.ReminderInterface;

public interface IReminderRepository : IGenericRepository<Reminder, string>
{
    Task<List<Reminder>> GetRemindersNotSentAsync(CancellationToken token);

    Task UpdateListReminderAsync(List<string> reminderList, CancellationToken cancellationToken);

    Task AddListReminderAsync(List<Reminder> reminderList, CancellationToken cancellationToken);
}