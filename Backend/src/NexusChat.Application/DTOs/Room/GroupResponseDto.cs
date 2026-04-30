using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs.Rooms;

public class GroupResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public RoomType RoomType { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}