using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs.Media;

public sealed record UploadMediaResponseDto(
    string MessageId,
    string FileUrl,
    string FileName,
    long FileSize,
    FileType FileType,
    bool IsPending
    );
