namespace NexusChat.Application.DTOs.Media;

public sealed record LinkPreviewResponseDto(
    string Url,
    string Title,
    string? Description,
    string? ImageUrl,
    string? SiteName,
    string? Favicon);