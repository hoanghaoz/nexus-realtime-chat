namespace NexusChat.Application.DTOs.Media;

public sealed record GetMediaRequestDto(
    string? Type = null,
    int Page = 1,
    int PageSize = 20
);
