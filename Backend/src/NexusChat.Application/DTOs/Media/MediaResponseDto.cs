namespace NexusChat.Application.DTOs.Media;

public sealed record MediaResponseDto(
    string MessageId,
    string FileUrl,
    string FileType,
    DateTime CreatedAt
);
