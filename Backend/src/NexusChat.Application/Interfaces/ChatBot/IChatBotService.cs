using ErrorOr;

namespace NexusChat.Application.Interfaces.ChatBot;

public interface IChatBotService
{
    Task<ErrorOr<IAsyncEnumerable<string>>> SummarizeMessageInConversationAsync(string conversationId,string userId,CancellationToken token);
}