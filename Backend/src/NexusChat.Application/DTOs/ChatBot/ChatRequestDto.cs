namespace NexusChat.Application.DTOs.ChatBot;

public sealed record ChatBotRequestDto(string ConversationId,string UserId,string Content,string Mission);