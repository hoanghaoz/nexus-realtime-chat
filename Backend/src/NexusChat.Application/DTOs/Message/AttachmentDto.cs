using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs.Message;

public sealed record AttachmentDto(string? FileUrl,long? FileSize,string? FileName,FileType? Type);