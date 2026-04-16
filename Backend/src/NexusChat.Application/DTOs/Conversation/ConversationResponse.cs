using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs.Conversation;

public sealed record ConversationResponse(
    RoomType TypeRoom,
    string DisplayName,
    string? DisplayAvatar,
    LastMessagePreviewResponse? LastMessage,
    bool IsOnline
);

public sealed record LastMessagePreviewResponse(
    string? Content,
    DateTime CreatedAt
);
