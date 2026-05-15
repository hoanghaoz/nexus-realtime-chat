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
using NexusChat.Application.Interfaces.UserRepository;
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
        var botId = configuration["ChatBot:BotId"] ?? throw new InvalidOperationException("Bot id is not configured");
        while (!stoppingToken.IsCancellationRequested)
            try
            {
                var requestBot = await chatBotQueue.DequeueAsync(stoppingToken);
                using var scope = scopeFactory.CreateScope();
                var chatBotService = scope.ServiceProvider.GetRequiredService<IChatBotService>();
                var messageRepository = scope.ServiceProvider.GetRequiredService<IMessageRepository>();
                var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
                var parentMessage = await messageRepository.GetByIdAsync(requestBot.ParentMessageId, stoppingToken);
                if (parentMessage == null)
                {
                    logger.LogError(
                        "Parent message not found for Chatbot assistant worker, ParentMessageId: {ParentMessageId}",
                        requestBot.ParentMessageId);
                    continue;
                }

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
                        await SendBotRemind(response, userRepository, messageRepository, requestBot, botId,
                            parentMessage, messageError, stoppingToken);
                        break;
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
                result.Value.Content ?? "I will support you later", newMessage.ReplyAt);
            await botReplyService.SendBotReplyAsync(botReply, stoppingToken);
        }
    }

    private async Task SendBotRemind(ErrorOr<RemindDataDto> response, IUserRepository userRepository,
        IMessageRepository messageRepository, ChatBotRequestDto requestBot, string botId, Message parentMessage,
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
                .Where(t => t.ExecuteAt == null || t.ExecuteAt.Value.AddHours(7) <= DateTime.UtcNow)
                .Select(t => new
                {
                    t.Task,
                }).ToList();
            
            // edge-case: if any task has executed-time = null
            // bot will reply an answer to ask user more information about time
            if (invalidExecuteTime.Count > 0)
            {
                var reply = new StringBuilder("Please provide time of below tasks: \n");
                foreach (var task in invalidExecuteTime)
                {
                    reply.Append($"- {task.Task} \n");
                }
                newMessage.Content = reply.ToString();
                await botReplyService.SendBotReplyErrorMessageAsync(reply.ToString(), requestBot.ConversationId, stoppingToken);
                await messageRepository.AddAsync(newMessage, stoppingToken);
                return;
            }
            var userDictionary = await userRepository.GetListUserAsync(parentMessage.MentionedUsersId, stoppingToken);
            var mentionedName = response.Value.MentionUserId.Select(u =>
            {
                var userName = userDictionary.GetValueOrDefault(u)?.UserName ?? "Unknown";
                return $"@{userName}";
            }).ToList();
            var username = mentionedName.Count > 0 ? string.Join(", ", mentionedName) : "you";
            var content = new StringBuilder($"I will remind {username} to do \n");
            foreach (var remindTask in response.Value.RemindTasks)
            {
                var utcTime = remindTask.ExecuteAt!.Value.AddHours(7);
                var data = $"- Task: {remindTask.Task}, time: {utcTime} \n";
                content.Append(data);
            }

            newMessage.Content = content.ToString();
            var botReply = new BotResponseDto(newMessage.Id, requestBot.ParentMessageId, requestBot.ConversationId,
                content.ToString(), newMessage.ReplyAt);
            await botReplyService.SendBotReplyAsync(botReply, stoppingToken);
        }

        await messageRepository.AddAsync(newMessage, stoppingToken);
    }
}