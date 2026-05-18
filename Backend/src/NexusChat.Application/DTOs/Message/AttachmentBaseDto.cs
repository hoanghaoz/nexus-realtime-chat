using System.Text.Json.Serialization;
using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs.Message;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "attachmentType")]
[JsonDerivedType(typeof(FileAttachmentDto), "file")]
[JsonDerivedType(typeof(LinkPreviewDto), "link_preview")]
public record AttachmentBaseDto(FileType? Type, DateTime CreatedAt);