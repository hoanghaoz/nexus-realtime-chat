using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs.Message;

public sealed record LinkPreviewDto(
    string? PreviewLinkUrl,
    string? Title,
    string? Description,
    string? ImageUrl,
    DateTime CreatedAt) : AttachmentBaseDto(FileType.LinkPreview, CreatedAt);