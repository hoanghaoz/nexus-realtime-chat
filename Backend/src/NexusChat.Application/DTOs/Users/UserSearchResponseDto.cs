using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs.Users;

public sealed record UserSearchResponseDto(string Id, string Username, string? Avatar, UserStatus Status);