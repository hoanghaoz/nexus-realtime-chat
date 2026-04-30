using NexusChat.Domain.Enum;

namespace NexusChat.Domain.Entity.EmbeddedObject;

public abstract class Attachment
{
    public FileType? FileType { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class FileAttachment : Attachment
{
    public string? FileName { get; set; }

    public long FileSize { get; set; } = 0;

    public string? FileUrl { get; set; }
}

public class LinkPreviewAttachment : Attachment
{
    public string? PreviewLinkUrl { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
}