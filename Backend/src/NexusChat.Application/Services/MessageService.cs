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
    public async Task<ErrorOr<MessageResultDto>> GetMessageInConversationAsync(GetMessageRequestDto dto,
        string fromUserId,
        string? cursor,
        CancellationToken token)
    {
        var isValidUser = await conversationRepository.IsUserInConversationAsync(dto.ConversationId, fromUserId, token);
        if (!isValidUser) return Error.Unauthorized("User.Unauthorized", "You are not a member of this conversation.");
        var nextCursor = cursor.ConvertToCursor();
        var response = await messageRepository.GetMessageInConversationAsync(dto.ConversationId,
            nextCursor?.CreatedAt, nextCursor?.MessageId, fromUserId, token);
        var result = new MessageResultDto(response, response.Count != 0
            ? $"{response.LastOrDefault()?.CreatedAt:o}_{response.LastOrDefault()?.MessageId}".ConvertToBase64()
            : null);
        return result;
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
        {
            if (existingReaction.Emoji == dto.Emoji)
            {
                // Toggle off
                updatedMessage.Reactions.Remove(existingReaction);
            }
            else
            {
                // Replace with new emoji
                updatedMessage.Reactions.Remove(existingReaction);
                updatedMessage.Reactions.Add(new Reaction
                {
                    FromUserId = fromUserId,
                    Emoji = dto.Emoji
                });
            }
        }
        else
        {
            updatedMessage.Reactions.Add(new Reaction
            {
                FromUserId = fromUserId,
                Emoji = dto.Emoji
            });
        }

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
            case ChatBotRegex.MissionRemind:
                await chatBotQueue.EnqueueAsync(new ChatBotRequestDto(
                    message.ConversationId,
                    fromUserId,
                    message.Id,
                    dto.Content,
                    ChatBotRegex.MissionRemind
                ), token);
                break;
            default:
                await chatBotQueue.EnqueueAsync(new ChatBotRequestDto(
                    message.ConversationId,
                    fromUserId,
                    message.Id,
                    dto.Content,
                    ChatBotRegex.MissionNone
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


    /// <summary>
    ///     Searches messages in a conversation by keyword.
    ///     Validates conversation membership before querying MongoDB Text Index.
    /// </summary>
    public async Task<ErrorOr<List<MessageResponseDto>>> SearchMessagesByKeywordAsync(
        MessageSearchRequestDto dto,
        string fromUserId,
        CancellationToken token)
    {
        var isValidUser = await conversationRepository.IsUserInConversationAsync(
            dto.ConversationId,
            fromUserId,
            token);

        if (!isValidUser)
            return Error.Unauthorized("User.Unauthorized", "You are not a member of this conversation.");

        if (string.IsNullOrWhiteSpace(dto.Keyword))
            return Error.Validation("Message.KeywordRequired", "Keyword is required.");

        var limit = Math.Clamp(dto.Limit, 1, 50);
        var skip = Math.Max(dto.Skip, 0);

        return await messageRepository.SearchMessagesByKeywordAsync(
            dto.ConversationId,
            dto.Keyword.Trim(),
            skip,
            limit,
            token);
    }

    public async Task<ErrorOr<MessageThreadResponseDto>> GetMessageThreadAsync(
        string messageId,
        string fromUserId,
        CancellationToken token)
    {
        var originalMessage = await messageRepository.GetByIdAsync(messageId, token);

        if (originalMessage is null || originalMessage.IsDeleted || originalMessage.IsPending)
            return Error.NotFound("Message.NotFound", "The message was not found.");

        var isValidUser = await conversationRepository.IsUserInConversationAsync(
            originalMessage.ConversationId,
            fromUserId,
            token);

        if (!isValidUser)
            return Error.Unauthorized("User.Unauthorized", "You are not a member of this conversation.");

        var replies = await messageRepository.GetRepliesByMessageIdAsync(
            originalMessage.Id,
            originalMessage.ConversationId,
            token);

        return new MessageThreadResponseDto(
            originalMessage.MapMessageDto(),
            replies);
    }
}