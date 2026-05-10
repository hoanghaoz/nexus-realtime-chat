using Microsoft.SemanticKernel.ChatCompletion;
using NexusChat.Application.Interfaces.ChatBot;
using NexusChat.Application.Interfaces.MessageInterface;

namespace NexusChat.Application.Services;

public class ChatBotService(
    IChatCompletionService chatCompletionService,
    IMessageRepository messageRepository) : IChatBotService
{
    public Task<IAsyncEnumerable<string>> SummarizeMessageInConversationAsync(CancellationToken token)
    {
        throw new NotImplementedException();
    }
}