using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NexusChat.Application.DTOs.ChatBot;
using NexusChat.Application.Interfaces.ChatBot;
using NexusChat.Application.Interfaces.MessageInterface;
using NexusChat.Application.Interfaces.ReminderInterface;
using NexusChat.Domain.Entity;

namespace NexusChat.Infrastructure.Worker;

public class ChatBotReminderWorker(
    ILogger<ChatBotReminderWorker> logger,
    IServiceScopeFactory serviceScopeFactory,
    IBotReplyService botReplyService,
    IConfiguration configuration) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Reminder bot started");
        var botId = configuration["ChatBot:BotId"] ?? throw new InvalidOperationException("Bot id is not configured");
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
            try
            {
                using var scope = serviceScopeFactory.CreateScope();
                var reminderRepository = scope.ServiceProvider.GetRequiredService<IReminderRepository>();
                var messageRepository = scope.ServiceProvider.GetRequiredService<IMessageRepository>();
                var reminderList = await reminderRepository.GetRemindersNotSentAsync(stoppingToken);
                if (reminderList.Count == 0) continue;
                var remindSent = new List<string>();
                var newMessages = new List<Message>();
                foreach (var reminder in reminderList)
                {
                    var mentionsString = string.Join(" ", reminder.MentionUserIds.Select(id => $"<@{id}>"));
                    var content = $"{mentionsString}, it's time to do {reminder.Task}";
                    var message = new Message
                    {
                        Id = Guid.NewGuid().ToString(),
                        ConversationId = reminder.ConversationId,
                        FromUserId = botId,
                        Content = content,
                        MentionedUsersId = reminder.MentionUserIds,
                        CreatedAt = DateTime.UtcNow
                    };
                    var botReply = new BotResponseDto(message.Id, message.ParentMessageId, message.ConversationId,
                        message.Content, message.ReplyAt, message.CreatedAt);
                    await botReplyService.SendBotReplyAsync(botReply, stoppingToken);
                    newMessages.Add(message);
                    remindSent.Add(reminder.Id);
                }

                await reminderRepository.UpdateListReminderAsync(remindSent, stoppingToken);
                await messageRepository.AddListMessageAsync(newMessages, stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred in ChatBotReminderWorker");
            }
    }
}