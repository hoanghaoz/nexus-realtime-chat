using System.Threading.Channels;
using NexusChat.Application.DTOs.Media;
using NexusChat.Application.Interfaces.Media;

namespace NexusChat.Infrastructure.Media;

public class LinkPreviewService : ILinkPreviewService
{
    private readonly Channel<LinkPreviewRequestDto> _queue;

    public LinkPreviewService()
    {
        var options = new BoundedChannelOptions(1000)
        {
            FullMode = BoundedChannelFullMode.Wait
        };
        _queue = Channel.CreateBounded<LinkPreviewRequestDto>(options);
    }

    public async ValueTask EnqueueAsync(LinkPreviewRequestDto requestDto, CancellationToken cancellationToken)
    {
        await _queue.Writer.WriteAsync(requestDto, cancellationToken);
    }

    public async ValueTask<LinkPreviewRequestDto> DequeueAsync(CancellationToken cancellationToken)
    {
        return await _queue.Reader.ReadAsync(cancellationToken);
    }
}