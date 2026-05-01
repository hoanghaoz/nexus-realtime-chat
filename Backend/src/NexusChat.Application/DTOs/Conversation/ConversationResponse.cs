using NexusChat.Domain.Enum;

namespace NexusChat.Application.DTOs.Conversation;

public sealed record ConversationResponse(
    string ConversationId,
    RoomType TypeRoom,
    string DisplayName,
    string? DisplayAvatar,
    LastMessagePreviewResponse? LastMessage,
    bool IsOnline,
    string Role
);

public sealed record LastMessagePreviewResponse(
    string? Content,
    DateTime CreatedAt
);
