namespace NexusChat.Application.DTOs.FriendRequests;

public sealed record FriendResponseDto(string Id,
    string UserName,
    string? Avatar,
    bool IsOnline
    );
