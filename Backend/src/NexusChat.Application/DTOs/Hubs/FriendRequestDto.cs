using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs.Hubs;

public sealed record FriendRequestDto (string FromUserId ,string ToUserId,  RequestType RequestType, DateTime CreatedAt );
