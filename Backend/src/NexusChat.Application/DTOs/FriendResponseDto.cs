using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs;

public sealed record FriendResponseDto(string Id,
    string UserName,
    string? Avatar,
    bool IsOnline
    );
