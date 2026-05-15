namespace NexusChat.Application.DTOs.ChatBot;

public sealed record ChatBotRequestDto(string ConversationId,string UserId,string ParentMessageId,string Content,string Mission);