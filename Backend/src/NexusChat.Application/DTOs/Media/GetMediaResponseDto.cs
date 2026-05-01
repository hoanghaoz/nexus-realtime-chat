namespace NexusChat.Application.DTOs.Media;

public sealed record GetMediaResponseDto(
    string MessageId,
    string FileUrl,
    string FileType,
    DateTime CreatedAt
);
