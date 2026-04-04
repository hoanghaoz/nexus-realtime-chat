using NexusChat.Domain.Enum;

namespace NexusChat.Domain.Entity.EmbeddedObject;

public class Attachment
{
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public FileType? FileType { get; set; }
}