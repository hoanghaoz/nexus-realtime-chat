using NexusChat.Application.DTOs.ChatBot;

namespace NexusChat.Application.Interfaces.ChatBot;

public interface IBotReplyService
{
    Task SendBotReplyAsync(BotResponseDto response,CancellationToken stoppingToken);

    Task SendBotReplyErrorMessageAsync(string message,string conversationId,CancellationToken stoppingToken);
}