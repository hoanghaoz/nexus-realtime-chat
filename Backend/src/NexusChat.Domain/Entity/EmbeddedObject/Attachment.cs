namespace NexusChat.Domain.Entity.EmbeddedObject;

public class Attachment
{
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public string? FileType { get; set; }
}