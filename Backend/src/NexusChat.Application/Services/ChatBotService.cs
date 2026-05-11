using System.Runtime.CompilerServices;
using System.Text;
using ErrorOr;
using Microsoft.SemanticKernel.ChatCompletion;
using NexusChat.Application.DTOs.ChatBot;
using NexusChat.Application.Interfaces.ChatBot;
using NexusChat.Application.Interfaces.ConversationService;
using NexusChat.Application.Interfaces.MessageInterface;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using NexusChat.Application.Constant;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Entity.EmbeddedObject;

namespace NexusChat.Application.Services;

public class ChatBotService(
    IChatCompletionService chatCompletionService,
    IMessageRepository messageRepository,
    IConversationService conversationService) : IChatBotService
{
    // TODO: generate system prompt when conversation is new
    public async Task<ErrorOr<IAsyncEnumerable<string>>> SummarizeMessageInConversationAsync(string conversationId,string userId,CancellationToken token)
    {
        var conversationDetail = await conversationService.GetConversationDetailAsync(conversationId, userId, token);
        if(conversationDetail.IsError)
            return conversationDetail.Errors;
        
        var messages = await messageRepository.GetMessagesForSummaryAsync(conversationId, token);
        
        var executionSettings = BuildSetting();
        IAsyncEnumerable<StreamingChatMessageContent> response;

        if (messages.Count == 0)
        {
            var systemPrompt = SystemPrompt.SummaryMessagePromptWhenEmptyChat();
            var emptyChatHistory = new ChatHistory(systemPrompt);
            response = chatCompletionService.GetStreamingChatMessageContentsAsync(
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
            var reducer = new ChatHistoryTruncationReducer(targetCount: 25, thresholdCount: 30);
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
                    content.Append($"[{message.CreatedAt:HH:mm}]: {message.SenderName}: {message.Content},{attachmentsString} \n");
                }
            }
            chat.AddUserMessage(content.ToString());
            var reducerMessage = await reducer.ReduceAsync(chat, token);
            
            if(reducerMessage != null) chat = new  ChatHistory(reducerMessage);
            
            response = chatCompletionService.GetStreamingChatMessageContentsAsync(
                chat,
                executionSettings,
                cancellationToken: token); 
        }
        return ErrorOrFactory.From(GenerateAnswer(response, conversationId, token));
    }

    private async IAsyncEnumerable<string> GenerateAnswer(IAsyncEnumerable<StreamingChatMessageContent> response,
        string conversationId, [EnumeratorCancellation] CancellationToken token)
    {
        var message = new StringBuilder();
        try
        {
            await foreach(var chunk in response.WithCancellation(token))
            {
                if (string.IsNullOrEmpty(chunk.Content)) continue;
                message.Append(chunk.Content);
                yield return chunk.Content;
            }

            yield return "\n";
        }
        finally
        {
            var botMessage = new Message
            {
                Id = Guid.NewGuid().ToString(),
                ConversationId = conversationId,
                FromUserId = "bot",
                Content = message.ToString(),
                Reactions = [],
                Attachments = [],
                CreatedAt = DateTime.UtcNow
            };
            await messageRepository.AddAsync(botMessage, token);
        }
    }

    private static OpenAIPromptExecutionSettings BuildSetting()
    {
        return new OpenAIPromptExecutionSettings
        {
            MaxTokens = 500,
            Temperature = 0.7
        };
    }
}