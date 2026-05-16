using ErrorOr;
using NexusChat.Application.DTOs.ChatBot;
using NexusChat.Application.DTOs.Media;
using NexusChat.Application.DTOs.Message;
using NexusChat.Application.Extension;
using NexusChat.Application.Interfaces.ChatBot;
using NexusChat.Application.Interfaces.ConversationRepository;
using NexusChat.Application.Interfaces.Hubs;
using NexusChat.Application.Interfaces.Media;
using NexusChat.Application.Interfaces.MessageInterface;
using NexusChat.Domain.Entity.EmbeddedObject;

namespace NexusChat.Application.Services;

public class MessageService(
    IMessageRepository messageRepository,
    IRealtimeNotification notify,
    IConversationRepository conversationRepository,
    ILinkPreviewService linkPreviewService,
    IChatBotQueue chatBotQueue) : IMessageService
{
    /// <summary>
    ///     Retrieves messages from a conversation with cursor-based pagination.
    /// </summary>
    public async Task<ErrorOr<List<MessageResponseDto>>> GetMessageInConversationAsync(MessageRequestDto dto,
        string fromUserId,
        CancellationToken token)
    {
        var isValidUser = await conversationRepository.IsUserInConversationAsync(dto.ConversationId, fromUserId, token);
        if (!isValidUser) return Error.Unauthorized("User.Unauthorized", "You are not a member of this conversation.");
        var messages = await messageRepository.GetMessageInConversationAsync(dto.ConversationId, dto.Cursor, token);
        return messages
            .Where(message => !message.IsPending || message.UserId == fromUserId)
            .ToList();
    }

    /// <summary>
    ///     Edits message content. Only the message owner can edit. Notifies all conversation members.
    /// </summary>
    public async Task<ErrorOr<MessageResponseDto>> EditMessageContentAsync(EditMessageRequestDto dto, string fromUserId,
        string messageId,
        CancellationToken token)
    {
        var updatedMessage = await messageRepository.GetByIdAsync(messageId, token);
        if (updatedMessage == null) return Error.NotFound("Message.NotFound", "The message was not found.");

        if (updatedMessage.FromUserId != fromUserId)
            return Error.Forbidden("Message.Forbidden", "You can only modify your own messages.");

        updatedMessage.Content = dto.NewContent;
        updatedMessage.IsEdited = true;
        updatedMessage.EditedAt = DateTime.UtcNow;
        await messageRepository.UpdateAsync(updatedMessage, token);
        await notify.NotifyMessageEditedAsync(updatedMessage.ConversationId, updatedMessage.Id, dto.NewContent, token);
        return updatedMessage.MapMessageDto();
    }

    /// <summary>
    ///     Adds or removes reaction from a message. Notifies all members and sends toast to message owner.
    /// </summary>
    public async Task<ErrorOr<MessageResponseDto>> ReactMessageContentAsync(ReactMessageRequestDto dto,
        string fromUserId,
        string messageId, CancellationToken token)
    {
        var updatedMessage = await messageRepository.GetByIdAsync(messageId, token);
        if (updatedMessage == null) return Error.NotFound("Message.NotFound", "The message was not found.");
        var existingReaction = updatedMessage.Reactions.FirstOrDefault(r => r.FromUserId == fromUserId);
        if (existingReaction != null)
            updatedMessage.Reactions.Remove(existingReaction);
        else
            updatedMessage.Reactions.Add(new Reaction
            {
                FromUserId = fromUserId,
                Emoji = dto.Emoji
            });
        await messageRepository.UpdateAsync(updatedMessage, token);
        await notify.NotifyMessageReactedAsync(updatedMessage.ConversationId, updatedMessage.Id, dto.Emoji, fromUserId,
            updatedMessage.FromUserId, token);
        // extension method to map message to messageDto
        return updatedMessage.MapMessageDto();
    }

    /// <summary>
    ///     Soft deletes a message. Only the message owner can delete. Notifies all conversation members.
    /// </summary>
    public async Task<ErrorOr<Success>> DeleteMessageContentAsync(string messageId, string fromUserId,
        CancellationToken token)
    {
        var updatedMessage = await messageRepository.GetByIdAsync(messageId, token);
        if (updatedMessage == null) return Error.NotFound("Message.NotFound", "The message was not found.");

        if (updatedMessage.FromUserId != fromUserId)
            return Error.Forbidden("Message.Forbidden", "You can only delete your own messages.");

        updatedMessage.IsDeleted = true;
        updatedMessage.DeletedAt = DateTime.UtcNow;
        await messageRepository.UpdateAsync(updatedMessage, token);
        await notify.NotifyMessageDeletedAsync(updatedMessage.ConversationId, updatedMessage.Id, token);
        return Result.Success;
    }

    /// <summary>
    ///     Creates a new message in a conversation.
    /// </summary>
    public async Task<ErrorOr<MessageResponseDto>> CreateMessageAsync(SendMessageRequestDto dto, string fromUserId,
        CancellationToken token)
    {
        var validUser = await conversationRepository.IsUserInConversationAsync(dto.ConversationId, fromUserId, token);
        if (!validUser) return Error.Unauthorized("User.Unauthorized", "You are not a member of this conversation.");

        var message = dto.MapToEntity(fromUserId);
        await messageRepository.AddAsync(message, token);
        // handle link preview if content had
        var link = dto.Content.GetFirstLink();
        if (link != null)
        {
            var linkRequest = new LinkPreviewRequestDto(
                message.Id,
                message.ConversationId,
                link
            );
            await linkPreviewService.EnqueueAsync(linkRequest, token);
        }

        if (dto.Content == null || !dto.Content.Contains("@Bot")) return message.MapMessageDto();
        var mission = dto.Content.DetectBotMission();
        switch (mission)
        {
            case ChatBotRegex.MissionSummarize:
                await chatBotQueue.EnqueueAsync(new ChatBotRequestDto(
                    message.ConversationId,
                    fromUserId,
                    message.Id,
                    dto.Content,
                    ChatBotRegex.MissionSummarize
                ), token);
                break;
            default:
                await chatBotQueue.EnqueueAsync(new ChatBotRequestDto(
                    message.ConversationId,
                    fromUserId,
                    message.Id,
                    dto.Content,
                    string.Empty
                ), token);
                break;
        }
        return message.MapMessageDto();
    }
    public async Task<ErrorOr<MessageResponseDto>> CompletePendingMessageAsync(string messageId, string fromUserId,
        CancellationToken token)
    {
        var message = await messageRepository.GetByIdAsync(messageId, token);
        if (message is null) return Error.NotFound("Message.NotFound", "The message was not found.");

        if (message.FromUserId != fromUserId)
            return Error.Forbidden("Message.Forbidden", "You can only complete your own pending message.");

        if (!message.IsPending)
            return Error.Conflict("Message.NotPending", "The message is already completed.");

        message.IsPending = false;
        await messageRepository.UpdateAsync(message, token);

        return message.MapMessageDto();
    }
}
