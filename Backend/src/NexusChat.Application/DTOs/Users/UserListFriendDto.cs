namespace NexusChat.Application.DTOs.Users;

public sealed record UserListFriendDto(string Id, string Username, string? Avatar, bool IsOnline, DateTime? LastOnline);