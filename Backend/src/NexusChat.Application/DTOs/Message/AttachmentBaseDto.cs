using System.Text.Json.Serialization;
using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs.Message;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "attachmentType")]
// 2. Dạy nó biết: nếu gặp FileAttachmentDto thì gán chữ "file"
[JsonDerivedType(typeof(FileAttachmentDto), "file")]
// 3. Nếu gặp LinkPreviewDto thì gán chữ "link_preview"
[JsonDerivedType(typeof(LinkPreviewDto), "link_preview")]
public record AttachmentBaseDto(FileType? Type, DateTime CreatedAt);