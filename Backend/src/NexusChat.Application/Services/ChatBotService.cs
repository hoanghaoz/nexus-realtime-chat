using System.Text;
using System.Text.Json;
using ErrorOr;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
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
    IConversationService conversationService) : IChatBotService
{
    public async Task<ErrorOr<ChatMessageContent>> SummarizeMessageInConversationAsync(string conversationId,
        string userId, CancellationToken token)
    {
        var conversationDetail = await conversationService.GetConversationDetailAsync(conversationId, userId, token);
        if (conversationDetail.IsError)
            return conversationDetail.Errors;

        var messages = await messageRepository.GetMessagesForSummaryAsync(conversationId, token);

        var executionSettings = BuildSetting();
        ChatMessageContent response;

        // generate data and system prompt for bot in 2 case: empty chat and non-empty chat, then call openAI to get summary result
        if (messages.Count == 0)
        {
            var systemPrompt = SystemPrompt.SummaryMessagePromptWhenEmptyChat();
            var emptyChatHistory = new ChatHistory(systemPrompt);
            response = await chatCompletionService.GetChatMessageContentAsync(
                emptyChatHistory,
                executionSettings,
                cancellationToken: token);
        }
        else
        {
            var messageData = messages.Select(m =>
            {
                var senderName = conversationDetail.Value.Participants.FirstOrDefault(p => p.UserId == m.FromUserId)
                    ?.DisplayName ?? "Unknown";
                return new MessageDataDto(
                    senderName,
                    m.Content,
                    m.CreatedAt,
                    m.Attachments.Select(ob => ob switch
                    {
                        FileAttachment file => $"[File Attachment] Name: {file.FileName}, Type: {file.FileType}",
                        LinkPreviewAttachment link => $"[Link Preview] Title: {link.Title}",
                        _ => "[Unknown Attachment]"
                    }).ToList(),
                    m.ParentMessageId);
            }).ToList();
            var systemPrompt = SystemPrompt.SummaryMessagePrompt();
            var chat = new ChatHistory(systemPrompt);

            // make a chat history reducer to control the token count of the message sent to openAI, we only keep 25 messages and will trigger reducer when the message count exceed 30
            var reducer = new ChatHistoryTruncationReducer(25, 30);
            var content = new StringBuilder();
            foreach (var message in messageData)
            {
                var attachments = message.AttachmentData;
                if (attachments.Count == 0)
                {
                    content.Append($"[{message.CreatedAt:HH:mm}]: {message.SenderName}: {message.Content} \n");
                }
                else
                {
                    var attachmentsString = string.Join(", ", attachments);
                    content.Append(
                        $"[{message.CreatedAt:HH:mm}]: {message.SenderName}: {message.Content},{attachmentsString} \n");
                }
            }

            chat.AddUserMessage(content.ToString());
            var reducerMessage = await reducer.ReduceAsync(chat, token);

            if (reducerMessage != null) chat = new ChatHistory(reducerMessage);

            response = await chatCompletionService.GetChatMessageContentAsync(
                chat,
                executionSettings,
                cancellationToken: token);
        }

        return response;
    }

    /// <summary>
    ///     This method handle the response llm model reply and parse to JSON  for feature remind user's tasks
    ///     Return RemindDataDto for background worker continues to handle query
    /// </summary>
    /// <param name="conversationId"></param>
    /// <param name="parentMessageId"></param>
    /// <param name="token"></param>
    /// <returns></returns>
    public async Task<ErrorOr<RemindDataDto>> RemindInConversationAsync(string conversationId, string parentMessageId,
        CancellationToken token)
    {
        var message = await messageRepository.GetByIdAsync(parentMessageId, token);
        if (message == null) return Error.NotFound("Message.NotFound", "The message was not found.");
        var systemPrompt = SystemPrompt.RemindMessagePrompt(DateTime.UtcNow);
        var executionSettings = BuildRemindSetting();
        var chat = new ChatHistory(systemPrompt);
        var content = message.Content ?? "";
        chat.AddUserMessage(content);

        var response = await chatCompletionService.GetChatMessageContentAsync(
            chat,
            executionSettings,
            cancellationToken: token);

        var jsonString = response.Content ?? "[]";
        try
        {
            var extractReminder = JsonSerializer.Deserialize<List<RemindExtractionDto>>(jsonString);
            var mentionUserId = message.MentionedUsersId.Count == 0 ? [] : message.MentionedUsersId;
            var remindTasks = extractReminder ?? [];
            var remindData = new RemindDataDto(remindTasks, mentionUserId);
            return remindData;
        }
        catch (FormatException ex)
        {
            return Error.Unexpected("RemindData.InvalidFormat",
                $"The format of the extracted reminder data is invalid: {ex.Message}");
        }
    }

    private static OpenAIPromptExecutionSettings BuildSetting()
    {
        return new OpenAIPromptExecutionSettings
        {
            MaxTokens = 500,
            Temperature = 0.7 // adjust llm creativity
        };
    }

    private static OpenAIPromptExecutionSettings BuildRemindSetting()
    {
        return new OpenAIPromptExecutionSettings
        {
            MaxTokens = 500,
            Temperature = 0 // adjust llm creativity
        };
    }
}