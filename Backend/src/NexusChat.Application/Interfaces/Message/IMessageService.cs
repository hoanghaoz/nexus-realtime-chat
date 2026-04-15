using ErrorOr;
using NexusChat.Application.DTOs.Message;

namespace NexusChat.Application.Interfaces.Message;

public interface IMessageService
{
    Task<ErrorOr<List<MessageResponseDto>>> GetMessageInConversationAsync(MessageRequestDto dto,
        CancellationToken token);

    Task<ErrorOr<MessageResponseDto>> EditMessageContentAsync(EditMessageRequestDto dto, string fromUserId,
        string messageId
        , CancellationToken token);

    Task<ErrorOr<MessageResponseDto>> ReactMessageContentAsync(ReactMessageRequestDto dto, string fromUserId,
        string messageId, CancellationToken token);

    Task<ErrorOr<Success>> DeleteMessageContentAsync(string messageId, string fromUserId, CancellationToken token);

    Task<ErrorOr<MessageResponseDto>> CreateMessageAsync(SendMessageRequestDto dto, string fromUserId,
        CancellationToken token);
}