using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs.Message;

public sealed record FileAttachmentDto(
    string? FileUrl,
    string? FileName,
    long? FileSize,
    FileType? Type,
    DateTime CreatedAt) : AttachmentBaseDto(Type, CreatedAt);