using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs.Users;

public sealed record UserUpdateDto(string Username, string? Avatar, UserStatus Status);

    