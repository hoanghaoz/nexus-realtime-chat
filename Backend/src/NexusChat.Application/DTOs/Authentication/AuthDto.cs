namespace NexusChat.Application.DTOs.Authentication;

public sealed record AuthDto(string Username, string? Email, string Password);