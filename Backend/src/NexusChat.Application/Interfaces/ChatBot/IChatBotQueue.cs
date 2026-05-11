using NexusChat.Application.DTOs.ChatBot;

namespace NexusChat.Application.Interfaces.ChatBot;

public interface IChatBotQueue
{
    ValueTask EnqueueAsync(ChatBotRequestDto dto,CancellationToken token);
    
    ValueTask<ChatBotRequestDto> DequeueAsync(CancellationToken token);
}