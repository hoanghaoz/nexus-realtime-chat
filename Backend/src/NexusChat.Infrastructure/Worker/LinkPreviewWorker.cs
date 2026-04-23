using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NexusChat.Application.DTOs.Media;
using NexusChat.Application.Interfaces.Hubs;
using NexusChat.Application.Interfaces.Media;
using NexusChat.Application.Interfaces.Message;
using NexusChat.Domain.Entity.EmbeddedObject;
using NexusChat.Domain.Enum;
using OpenGraphNet;

namespace NexusChat.Infrastructure.Worker;

public class LinkPreviewWorker(
    ILinkPreviewService linkPreviewService,
    IServiceScopeFactory scopeFactory,
    INotifyLinkPreviewed notifyLinkPreviewed,
    ILogger<LinkPreviewWorker> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Link Preview worker is working");

        // Keep consuming queued link jobs until the host shuts down.
        while (!stoppingToken.IsCancellationRequested)
            try
            {
                var link = await linkPreviewService.DequeueAsync(stoppingToken);

                // Drop malformed URLs and continue with the next queued item.
                if (!Uri.TryCreate(link.Url, UriKind.Absolute, out var parsedUrl))
                {
                    logger.LogWarning("Skip link preview for message {MessageId} because URL is invalid: {Url}",
                        link.MessageId, link.Url);
                    continue;
                }

                // Bound each fetch with a short timeout so slow websites do not block the queue.
                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                timeoutCts.CancelAfter(TimeSpan.FromSeconds(5));

                // Fetch Open Graph metadata and map it to the message link preview attachment.
                var graph = await OpenGraph.ParseUrlAsync(parsedUrl.ToString(), cancellationToken: timeoutCts.Token);
                logger.LogInformation("Link preview fetched for message {MessageId}", link.MessageId);

                var previewAttachment = new LinkPreviewAttachment
                {
                    FileType = FileType.LinkPreview,
                    PreviewLinkUrl = graph.Url?.ToString() ?? parsedUrl.ToString(),
                    Title = graph.Title,


                    Description = GetMetaValueFallback(graph, "og:description", "description"),
                    ImageUrl = graph.Image?.ToString() ?? GetMetaValueFallback(graph, "og:image", "twitter:image")
                };

                var linkPreviewResponse = new LinkPreviewResponseDto(
                    previewAttachment.PreviewLinkUrl,
                    previewAttachment.Title,
                    previewAttachment.Description,
                    previewAttachment.ImageUrl,
                    GetMetaValueFallback(graph, "og:site_name") ?? null,
                    $"https://www.google.com/s2/favicons?domain={parsedUrl.Host}&sz=64"
                );

                // Resolve repository from a scope because the worker itself is singleton/hosted.
                using var scope = scopeFactory.CreateScope();
                var messageRepository = scope.ServiceProvider.GetRequiredService<IMessageRepository>();
                await messageRepository.UpdateAttachmentAsync(link.MessageId, previewAttachment, stoppingToken);
                await notifyLinkPreviewed.NotifyLinkPreviewedAsync(link.MessageId, link.ConversationId,
                    linkPreviewResponse, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (OperationCanceledException operationCanceledException)
            {
                // Timeout token canceled this specific job; worker should keep processing remaining jobs.
                logger.LogWarning(operationCanceledException,"Timeout when get link preview");
            }
            catch (Exception ex)
            {
                // Log and continue so one failed URL does not stop the background worker.
                logger.LogError(ex, "Failed to process link preview job");
            }

        logger.LogInformation("Link Preview worker is stopping");
    }

    private static string? GetMetaValueFallback(OpenGraph graph, params string[] keys)
    {
        // Try metadata keys in priority order and return the first non-empty value.
        foreach (var key in keys)
            if (graph.Metadata.TryGetValue(key, out var metaValues) && metaValues.Any())
            {
                var value = metaValues.First().Value;
                if (!string.IsNullOrWhiteSpace(value)) return value;
            }

        return null;
    }
}