using Microsoft.AspNetCore.SignalR;
using NexusChat.Application.DTOs.ChatBot;
using NexusChat.Application.Interfaces.ChatBot;
using NexusChat.Application.Interfaces.Hubs;

namespace NexusChat.Api.Hubs;

public class BotReplyService(IHubContext<ChatHub,IChatClient> hubContext) : IBotReplyService
{
    public async Task SendBotReplyAsync(BotResponseDto response,CancellationToken stoppingToken)
    {
        await hubContext.Clients.Group(response.ConversationId).ReceiveBotReply(response);
    }

    public async Task SendBotReplyErrorMessageAsync(string message,string conversationId,CancellationToken stoppingToken)
    {
        await hubContext.Clients.Group(conversationId).ReceiveErrorMessage(message);
    }
}