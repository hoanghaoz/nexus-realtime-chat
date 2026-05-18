namespace NexusChat.Application.DTOs.ChatBot;

public sealed record RemindDataDto(List<RemindExtractionDto> RemindTasks, List<string> MentionUserId);