using System.Text;
using ErrorOr;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using NexusChat.Application.DTOs.ChatBot;
using NexusChat.Application.Extension;
using NexusChat.Application.Interfaces.ChatBot;
using NexusChat.Application.Interfaces.MessageInterface;
using NexusChat.Application.Interfaces.ReminderInterface;
using NexusChat.Domain.Entity;

namespace NexusChat.Infrastructure.Worker;

public class ChatBotAssistantWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<ChatBotAssistantWorker> logger,
    IChatBotQueue chatBotQueue,
    IBotReplyService botReplyService,
    IConfiguration configuration) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Chatbot assistant is ready");
        const string messageError = "Please try again later";
        var botId = configuration["ChatBot:BotId"] ?? "15c5232d-1bd9-4bbd-98e0-1ea7308e80bb";
        while (!stoppingToken.IsCancellationRequested)
            try
            {
                var requestBot = await chatBotQueue.DequeueAsync(stoppingToken);
                using var scope = scopeFactory.CreateScope();
                var chatBotService = scope.ServiceProvider.GetRequiredService<IChatBotService>();
                var messageRepository = scope.ServiceProvider.GetRequiredService<IMessageRepository>();
                var reminderRepository = scope.ServiceProvider.GetRequiredService<IReminderRepository>();
                var parentMessage = await messageRepository.GetByIdAsync(requestBot.ParentMessageId, stoppingToken);
                if (parentMessage == null)
                {
                    logger.LogError(
                        "Parent message not found for Chatbot assistant worker, ParentMessageId: {ParentMessageId}",
                        requestBot.ParentMessageId);
                    continue;
                }

                // Retry với exponential backoff khi gặp 429 Rate Limit
                const int maxRetries = 3;
                var attempt = 0;
                var success = false;
                while (attempt <= maxRetries && !success)
                {
                    try
                    {
                        switch (requestBot.Mission)
                        {
                            case ChatBotRegex.MissionSummarize:
                                var result = await chatBotService.SummarizeMessageInConversationAsync(requestBot.ConversationId,
                                    requestBot.UserId, stoppingToken);
                                await SendBotReply(result, messageError, requestBot, messageRepository, botId, stoppingToken);
                                break;

                            case ChatBotRegex.MissionRemind:
                                var response = await chatBotService.RemindInConversationAsync(requestBot.ConversationId,
                                    requestBot.ParentMessageId, stoppingToken);
                                await SendBotRemind(response, messageRepository, reminderRepository, requestBot, botId,
                                    messageError, stoppingToken);
                                break;

                            default:
                                var answer = await chatBotService.AnswerMessageInConversationAsync(requestBot.ConversationId, requestBot.UserId, stoppingToken);
                                await SendBotReply(answer, messageError, requestBot, messageRepository, botId, stoppingToken);
                                break;
                        }
                        success = true;
                    }
                    catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.TooManyRequests ||
                                                          ex.Message.Contains("429"))
                    {
                        attempt++;
                        if (attempt > maxRetries)
                        {
                            logger.LogError(ex, "Rate limit exceeded after {MaxRetries} retries for conversation {ConversationId}", maxRetries, requestBot.ConversationId);
                            var errMessage = new Message { Id = Guid.NewGuid().ToString(), ConversationId = requestBot.ConversationId, FromUserId = botId, Content = "Hệ thống AI đang quá tải (Rate Limit). Vui lòng thử lại sau ít phút!", ParentMessageId = requestBot.ParentMessageId, ReplyAt = DateTime.UtcNow };
                            await messageRepository.AddAsync(errMessage, stoppingToken);
                            var botReply = new BotResponseDto(errMessage.Id, requestBot.ParentMessageId, requestBot.ConversationId, errMessage.Content, errMessage.ReplyAt, errMessage.CreatedAt);
                            await botReplyService.SendBotReplyAsync(botReply, stoppingToken);
                            break;
                        }
                        var delaySeconds = Math.Pow(2, attempt); // 2s, 4s, 8s
                        logger.LogWarning("Rate limited (429). Retrying attempt {Attempt}/{MaxRetries} in {Delay}s...", attempt, maxRetries, delaySeconds);
                        await Task.Delay(TimeSpan.FromSeconds(delaySeconds), stoppingToken);
                    }
                    catch (Exception ex) when (ex.InnerException is HttpRequestException innerHttp &&
                                               (innerHttp.StatusCode == System.Net.HttpStatusCode.TooManyRequests ||
                                                ex.Message.Contains("429")))
                    {
                        attempt++;
                        if (attempt > maxRetries)
                        {
                            logger.LogError(ex, "Rate limit exceeded after {MaxRetries} retries for conversation {ConversationId}", maxRetries, requestBot.ConversationId);
                            var errMessage = new Message { Id = Guid.NewGuid().ToString(), ConversationId = requestBot.ConversationId, FromUserId = botId, Content = "Hệ thống AI đang quá tải (Rate Limit). Vui lòng thử lại sau ít phút!", ParentMessageId = requestBot.ParentMessageId, ReplyAt = DateTime.UtcNow };
                            await messageRepository.AddAsync(errMessage, stoppingToken);
                            var botReply = new BotResponseDto(errMessage.Id, requestBot.ParentMessageId, requestBot.ConversationId, errMessage.Content, errMessage.ReplyAt, errMessage.CreatedAt);
                            await botReplyService.SendBotReplyAsync(botReply, stoppingToken);
                            break;
                        }
                        var delaySeconds = Math.Pow(2, attempt);
                        logger.LogWarning("Rate limited (429). Retrying attempt {Attempt}/{MaxRetries} in {Delay}s...", attempt, maxRetries, delaySeconds);
                        await Task.Delay(TimeSpan.FromSeconds(delaySeconds), stoppingToken);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "LLM or ChatBot service exception for conversation {ConversationId}", requestBot.ConversationId);
                        var errMessage = new Message { Id = Guid.NewGuid().ToString(), ConversationId = requestBot.ConversationId, FromUserId = botId, Content = "Xin lỗi, đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại sau!", ParentMessageId = requestBot.ParentMessageId, ReplyAt = DateTime.UtcNow };
                        await messageRepository.AddAsync(errMessage, stoppingToken);
                        var botReply = new BotResponseDto(errMessage.Id, requestBot.ParentMessageId, requestBot.ConversationId, errMessage.Content, errMessage.ReplyAt, errMessage.CreatedAt);
                        await botReplyService.SendBotReplyAsync(botReply, stoppingToken);
                        break;
                    }
                }

                parentMessage.ReplyCount += 1;
                await messageRepository.UpdateAsync(parentMessage, stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in Chatbot assistant worker");
            }
    }

    private async Task SendBotReply(ErrorOr<ChatMessageContent> result,
        string messageError, ChatBotRequestDto requestBot, IMessageRepository messageRepository, string botId,
        CancellationToken stoppingToken)
    {
        if (result.IsError)
        {
            var newMessage = new Message
            {
                Id = Guid.NewGuid().ToString(),
                ConversationId = requestBot.ConversationId,
                FromUserId = botId,
                Content = messageError,
                ParentMessageId = requestBot.ParentMessageId,
                ReplyAt = DateTime.UtcNow
            };
            await messageRepository.AddAsync(newMessage, stoppingToken);
            await botReplyService.SendBotReplyErrorMessageAsync(messageError, requestBot.ConversationId, stoppingToken);
            logger.LogError("Error in Chatbot assistant worker: {Errors}", result.Errors);
        }
        else
        {
            var newMessage = new Message
            {
                Id = Guid.NewGuid().ToString(),
                ConversationId = requestBot.ConversationId,
                FromUserId = botId,
                Content = result.Value.Content,
                ParentMessageId = requestBot.ParentMessageId,
                ReplyAt = DateTime.UtcNow
            };
            await messageRepository.AddAsync(newMessage, stoppingToken);
            var botReply = new BotResponseDto(newMessage.Id, requestBot.ParentMessageId, requestBot.ConversationId,
                result.Value.Content ?? "I will support you later", newMessage.ReplyAt, newMessage.CreatedAt);
            await botReplyService.SendBotReplyAsync(botReply, stoppingToken);
        }
    }

    private async Task SendBotRemind(ErrorOr<RemindDataDto> response,
        IMessageRepository messageRepository, IReminderRepository reminderRepository, ChatBotRequestDto requestBot,
        string botId,
        string messageError,
        CancellationToken stoppingToken)
    {
        var newMessage = new Message
        {
            Id = Guid.NewGuid().ToString(),
            ConversationId = requestBot.ConversationId,
            FromUserId = botId,
            ReplyAt = DateTime.UtcNow,
            ParentMessageId = requestBot.ParentMessageId
        };
        if (response.IsError)
        {
            await botReplyService.SendBotReplyErrorMessageAsync(
                messageError,
                requestBot.ConversationId, stoppingToken);
            newMessage.Content = messageError;
        }
        else if (response.Value.RemindTasks.Count <= 0)
        {
            await botReplyService.SendBotReplyErrorMessageAsync(
                "No remind task found,please provide more information",
                requestBot.ConversationId, stoppingToken);
            newMessage.Content = "No remind task found,please provide more information";
        }
        else
        {
            var invalidExecuteTime = response.Value.RemindTasks
                .Where(t => t.ExecuteAt == null || t.ExecuteAt.Value <= DateTime.UtcNow)
                .Select(t => new
                {
                    t.Task
                }).ToList();

            // edge-case: if any task has executed-time = null
            // bot will reply an answer to ask user more information about time
            if (invalidExecuteTime.Count > 0)
            {
                var reply = new StringBuilder("Please provide time of below tasks: \n");
                foreach (var task in invalidExecuteTime) reply.Append($"- {task.Task} \n");
                newMessage.Content = reply.ToString();
                await botReplyService.SendBotReplyErrorMessageAsync(reply.ToString(), requestBot.ConversationId,
                    stoppingToken);
                await messageRepository.AddAsync(newMessage, stoppingToken);
                return;
            }

            var reminders = new List<Reminder>();
            var username = response.Value.MentionUserId.Count > 0
                ? string.Join(" ", response.Value.MentionUserId.Select(id => $"<@{id}>"))
                : "you";
            var content = new StringBuilder($"I will remind {username} to do \n");
            foreach (var remindTask in response.Value.RemindTasks)
            {
                var vnTime = remindTask.ExecuteAt!.Value.AddHours(7);
                var data = $"- Task: {remindTask.Task}, time: {vnTime} \n";
                content.Append(data);
                var reminder = new Reminder
                {
                    ConversationId = requestBot.ConversationId,
                    Task = remindTask.Task,
                    ExecuteAt = remindTask.ExecuteAt.Value,
                    MentionUserIds = response.Value.MentionUserId
                };
                reminders.Add(reminder);
            }

            newMessage.Content = content.ToString();
            var botReply = new BotResponseDto(newMessage.Id, requestBot.ParentMessageId, requestBot.ConversationId,
                content.ToString(), newMessage.ReplyAt, newMessage.CreatedAt);
            await botReplyService.SendBotReplyAsync(botReply, stoppingToken);
            await reminderRepository.AddListReminderAsync(reminders, stoppingToken);
        }

        await messageRepository.AddAsync(newMessage, stoppingToken);
    }
}