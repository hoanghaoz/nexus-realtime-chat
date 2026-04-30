using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs.FriendRequests;

public sealed record FriendRequestDto (
    string Id, 
    string FromUserId, 
    string FromName, 
    string FromAvatar, 
    DateTime CreatedAt);
