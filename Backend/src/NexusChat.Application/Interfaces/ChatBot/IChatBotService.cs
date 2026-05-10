namespace NexusChat.Application.Interfaces.ChatBot;

public interface IChatBotService
{
    Task<IAsyncEnumerable<string>> SummarizeMessageInConversationAsync(CancellationToken token);
}