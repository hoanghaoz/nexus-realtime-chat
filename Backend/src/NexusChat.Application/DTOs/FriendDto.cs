using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs;

public sealed record FriendDto(string Id, string Username,string? Avatar,UserStatus Status);