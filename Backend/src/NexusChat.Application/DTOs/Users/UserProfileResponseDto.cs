using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs.Users;

public class UserProfileResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public UserStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int FriendCount { get; set; }
}