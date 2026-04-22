using NexusChat.Application.DTOs.Media;

namespace NexusChat.Application.Interfaces.Media;

public interface ILinkPreviewService
{
    ValueTask EnqueueAsync(LinkPreviewRequestDto requestDto, CancellationToken cancellationToken = default);

    ValueTask<LinkPreviewRequestDto> DequeueAsync(CancellationToken cancellationToken = default);
}