using ErrorOr;
using Microsoft.SemanticKernel;
using NexusChat.Application.DTOs.ChatBot;

namespace NexusChat.Application.Interfaces.ChatBot;

public interface IChatBotService
{
    Task<ErrorOr<ChatMessageContent>> SummarizeMessageInConversationAsync(string conversationId, string userId,
        CancellationToken token);

    Task<ErrorOr<RemindDataDto>> RemindInConversationAsync(string conversationId, string parentMessageId,
        CancellationToken token);

    Task<ErrorOr<ChatMessageContent>> AnswerMessageInConversationAsync(string conversationId, string userId,
        CancellationToken token);
}