using System.Threading.Channels;
using NexusChat.Application.DTOs.ChatBot;
using NexusChat.Application.Interfaces.ChatBot;

namespace NexusChat.Application.Services;

public class ChatBotQueue : IChatBotQueue
{
    private readonly Channel<ChatBotRequestDto> _queue;

    public ChatBotQueue()
    {
        var options = new BoundedChannelOptions(capacity: 10)
        {
            FullMode = BoundedChannelFullMode.Wait
        };
        _queue = Channel.CreateBounded<ChatBotRequestDto>(options);
    }
    public async ValueTask EnqueueAsync(ChatBotRequestDto dto, CancellationToken token)
    {
        await  _queue.Writer.WriteAsync(dto, token);
    }

    public async ValueTask<ChatBotRequestDto> DequeueAsync(CancellationToken token)
    {
        return  await _queue.Reader.ReadAsync(token);
    }
}