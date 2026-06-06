using System.Text;
using System.Text.Json;
using ErrorOr;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using NexusChat.Application.Constant;
using NexusChat.Application.DTOs.ChatBot;
using NexusChat.Application.Interfaces.ChatBot;
using NexusChat.Application.Interfaces.ConversationService;
using NexusChat.Application.Interfaces.MessageInterface;
using NexusChat.Domain.Entity.EmbeddedObject;

namespace NexusChat.Application.Services;

public class ChatBotService(
    IChatCompletionService chatCompletionService,
    IMessageRepository messageRepository,
    IConversationService conversationService,
    IConfiguration configuration,
    ILogger<ChatBotService> logger) : IChatBotService
{
    public async Task<ErrorOr<ChatMessageContent>> SummarizeMessageInConversationAsync(string conversationId,
        string userId, CancellationToken token)
    {
        var conversationDetail = await conversationService.GetConversationDetailAsync(conversationId, userId, token);
        if (conversationDetail.IsError)
            return conversationDetail.Errors;

        var messages = await messageRepository.GetMessagesForBotDataAsync(conversationId, 25, token);

        var executionSettings = BuildSetting();
        var chat = new ChatHistory();

        if (messages.Count == 0)
        {
            var systemPrompt = SystemPrompt.SummaryMessagePromptWhenEmptyChat();
            chat.AddUserMessage(
                $"{systemPrompt}\n\n[Hệ thống]: Phòng chat này chưa có dữ liệu, hãy phản hồi ngắn gọn.");
        }
        else
        {
            var systemPrompt = SystemPrompt.SummaryMessagePrompt();
            var content = new StringBuilder();
            content.AppendLine(systemPrompt);
            content.AppendLine("\n--- BẮT ĐẦU LỊCH SỬ TRÒ CHUYỆN ---");

            foreach (var m in messages)
            {
                var senderName = conversationDetail.Value.Participants.FirstOrDefault(p => p.UserId == m.FromUserId)
                    ?.DisplayName ?? "Unknown";
                var attachments = m.Attachments.Select(ob => ob switch
                {
                    FileAttachment file => $"[File Attachment] Name: {file.FileName}, Type: {file.FileType}",
                    LinkPreviewAttachment link => $"[Link Preview] Title: {link.Title}",
                    _ => "[Unknown Attachment]"
                }).ToList();

                var attachmentsString = attachments.Count > 0 ? $", {string.Join(", ", attachments)}" : "";

                var textContent = string.IsNullOrWhiteSpace(m.Content) ? "[Chỉ đính kèm tệp]" : m.Content;
                content.AppendLine($"[{m.CreatedAt:HH:mm}] {senderName}: {textContent}{attachmentsString}");
            }

            content.AppendLine("--- KẾT THÚC LỊCH SỬ TRÒ CHUYỆN ---");
            chat.AddUserMessage(content.ToString());
            logger.LogInformation("Send to AI: \n{Prompt}", content.ToString());
        }

        return await chatCompletionService.GetChatMessageContentAsync(chat, executionSettings,
            cancellationToken: token);
    }

    public async Task<ErrorOr<RemindDataDto>> RemindInConversationAsync(string conversationId, string parentMessageId,
        CancellationToken token)
    {
        var message = await messageRepository.GetByIdAsync(parentMessageId, token);
        if (message == null) return Error.NotFound("Message.NotFound", "The message was not found.");

        var historyChat = await messageRepository.GetMessagesForBotDataAsync(conversationId, 5, token);
        var executionSettings = BuildRemindSetting();

        var systemPrompt = SystemPrompt.RemindMessagePrompt(DateTime.UtcNow);
        var contentBuilder = new StringBuilder();

        contentBuilder.AppendLine(systemPrompt);
        contentBuilder.AppendLine("\n--- BẮT ĐẦU LỊCH SỬ TRÒ CHUYỆN ---");

        var botId = configuration["Chatbot:BotId"] ?? "15c5232d-1bd9-4bbd-98e0-1ea7308e80bb";

        foreach (var item in historyChat)
        {
            if (string.IsNullOrWhiteSpace(item.Content)) continue;
            var sender = item.FromUserId == botId ? "Assistant" : "User";
            contentBuilder.AppendLine($"[{sender}]: {item.Content}");
        }

        contentBuilder.AppendLine($"[User]: {message.Content}");
        contentBuilder.AppendLine("--- KẾT THÚC LỊCH SỬ TRÒ CHUYỆN ---");

        var chat = new ChatHistory();
        chat.AddUserMessage(contentBuilder.ToString());
        logger.LogInformation("Send to AI: \n{Prompt}", contentBuilder.ToString());
        var response =
            await chatCompletionService.GetChatMessageContentAsync(chat, executionSettings, cancellationToken: token);

        var jsonString = response.Content ?? "[]";

        if (jsonString.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
            jsonString = jsonString.Replace("```json", "", StringComparison.OrdinalIgnoreCase)
                .Replace("```", "")
                .Trim();

        try
        {
            var extractReminder = JsonSerializer.Deserialize<List<RemindExtractionDto>>(jsonString);
            var mentionUserId = message.MentionedUsersId.Count == 0 ? [] : message.MentionedUsersId;
            var remindTasks = extractReminder ?? [];
            return new RemindDataDto(remindTasks, mentionUserId);
        }
        catch (JsonException ex)
        {
            return Error.Unexpected("RemindData.InvalidFormat",
                $"The format of the extracted reminder data is invalid: {ex.Message}");
        }
    }

    public async Task<ErrorOr<ChatMessageContent>> AnswerMessageInConversationAsync(string conversationId,
        string userId, CancellationToken token)
    {
        var conversationDetail = await conversationService.GetConversationDetailAsync(conversationId, userId, token);
        if (conversationDetail.IsError)
            return conversationDetail.Errors;

        var messages = await messageRepository.GetMessagesForBotDataAsync(conversationId, 25, token);
        var executionSettings = BuildSetting();

        var systemPrompt = SystemPrompt.GeneralAssistantPrompt();
        var content = new StringBuilder();

        content.AppendLine(systemPrompt);
        content.AppendLine("\n--- BẮT ĐẦU LỊCH SỬ TRÒ CHUYỆN ---");

        foreach (var m in messages)
        {
            if (string.IsNullOrWhiteSpace(m.Content) && m.Attachments.Count == 0) continue;

            var senderName = conversationDetail.Value.Participants.FirstOrDefault(p => p.UserId == m.FromUserId)
                ?.DisplayName ?? "Unknown";
            var attachments = m.Attachments.Select(ob => ob switch
            {
                FileAttachment file => $"[File Attachment] Name: {file.FileName}, Type: {file.FileType}",
                LinkPreviewAttachment link => $"[Link Preview] Title: {link.Title}",
                _ => "[Unknown Attachment]"
            }).ToList();

            var attachmentsString = attachments.Count > 0 ? $", {string.Join(", ", attachments)}" : "";
            var textContent = string.IsNullOrWhiteSpace(m.Content) ? "[Chỉ đính kèm tệp]" : m.Content;

            content.AppendLine($"[{m.CreatedAt:HH:mm}] {senderName}: {textContent}{attachmentsString}");
        }

        content.AppendLine("--- KẾT THÚC LỊCH SỬ TRÒ CHUYỆN ---");

        var chat = new ChatHistory();
        chat.AddUserMessage(content.ToString());
        logger.LogInformation("Send to AI: \n{Prompt}", content.ToString());
        return await chatCompletionService.GetChatMessageContentAsync(chat, executionSettings,
            cancellationToken: token);
    }

    private static PromptExecutionSettings BuildSetting()
    {
        return new PromptExecutionSettings
        {
            ExtensionData = new Dictionary<string, object>
            {
                { "temperature", 0.7 },
                { "max_tokens", 500 }
            }
        };
    }

    private static PromptExecutionSettings BuildRemindSetting()
    {
        return new PromptExecutionSettings
        {
            ExtensionData = new Dictionary<string, object>
            {
                { "temperature", 0 },
                { "max_tokens", 500 }
            }
        };
    }
}