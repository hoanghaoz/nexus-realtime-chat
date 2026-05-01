namespace NexusChat.Application.DTOs.Media;

public sealed record UploadMediaRequestDto(
    string FileName,
    long FileSize,
    Stream? Stream);
