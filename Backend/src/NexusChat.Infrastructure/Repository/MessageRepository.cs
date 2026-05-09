using MongoDB.Driver;
using MongoDB.Driver.Linq;
using NexusChat.Application.DTOs.Media;
using NexusChat.Application.DTOs.Message;
using NexusChat.Application.Extension;
using NexusChat.Application.Interfaces.Message;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Entity.EmbeddedObject;
using NexusChat.Domain.Enum;
using NexusChat.Infrastructure.Data.Interface;
using NexusChat.Infrastructure.Repository.Common;

namespace NexusChat.Infrastructure.Repository;

public class MessageRepository(
    IMongoDatabase mongoDatabase,
    IMongoUnitOfWork mongoUnitOfWork)
    : GenericRepository<Message, string>(mongoDatabase, mongoUnitOfWork), IMessageRepository
{
    /// <summary>
    ///     Apply Cursor Pagination to get message from conversation,
    ///     if the cursor is null, it means that we are getting the latest messages,
    ///     so we will order by createdAt descending and take 20 messages.
    ///     Otherwise, we will get the messages that are created before the cursor and order by createdAt descending and take
    ///     20 messages.
    /// </summary>
    /// <param name="conversationId"></param>
    /// <param name="cursor"></param>
    /// <param name="token"></param>
    /// <returns></returns>
    public async Task<List<MessageResponseDto>> GetMessageInConversationAsync(string conversationId,
        DateTime? cursor, CancellationToken token)
    {
        var query = DbSet.AsQueryable();
        query = cursor == null
            ? query.Where(x => x.ConversationId.Equals(conversationId))
            : query.Where(x => x.ConversationId.Equals(conversationId) && x.CreatedAt < cursor);

        var messages = await query.OrderByDescending(x => x.CreatedAt).Take(20).ToListAsync(token);

        var response = messages.Select(m => new MessageResponseDto
        (
            m.Id,
            m.FromUserId,
            m.Content,
            m.ConversationId,
            m.CreatedAt,
            m.Attachments.Select(ob => ob switch
            {
                FileAttachment file => (AttachmentBaseDto)new FileAttachmentDto(
                    file.FileUrl ?? string.Empty,
                    file.FileName ?? string.Empty,
                    file.FileSize,
                    file.FileType,
                    file.CreatedAt
                ),
                LinkPreviewAttachment link => new LinkPreviewDto(
                    link.PreviewLinkUrl ?? string.Empty,
                    link.Title ?? string.Empty,
                    link.Description ?? string.Empty,
                    link.ImageUrl ?? string.Empty,
                    link.CreatedAt
                ),
                _ => throw new InvalidOperationException($"Unknown attachment type: {ob.GetType().Name}")
            }).ToList(),
            m.Reactions.Select(re => new ReactionDto(
                    re.FromUserId,
                    re.Emoji))
                .ToList(),
            m.MentionedUsersId,
            m.IsDeleted,
            m.IsEdited,
            m.IsPending,
            m.DeletedAt,
            m.EditedAt
        )).ToList();
        return response;
    }

    public async Task<MessageResponseDto> UpdateAttachmentAsync(string messageId,
        LinkPreviewAttachment linkPreviewAttachment, CancellationToken token)
    {
        var entity = await DbSet.AsQueryable()
            .Where(x => x.Id.Equals(messageId))
            .FirstOrDefaultAsync(token);

        if (entity is null) throw new KeyNotFoundException($"Message with id '{messageId}' was not found.");

        entity.Attachments.Add(linkPreviewAttachment);
        await UpdateAsync(entity, token);

        return entity.MapMessageDto();
    }

    public async Task<List<GetMediaResponseDto>> GetMediaByConversationIdAsync(string conversationId, string? type, int skip, int limit, CancellationToken token)
    {
        var requestedType = ResolveMediaType(type);
        var messages = await DbSet.AsQueryable()
            .Where(message => message.ConversationId == conversationId
                              && !message.IsDeleted
                              && !message.IsPending // get only message upload successfully, skip messages is loading or error
                              && message.Attachments.Any())
            .OrderByDescending(message => message.CreatedAt)
            .ToListAsync(token);

        return messages
            .SelectMany(message => message.Attachments.OfType<FileAttachment>()
                .Select(attachment => new { Message = message, Attachment = attachment }))
            .Where(item => requestedType is null || item.Attachment.FileType == requestedType)
            .OrderByDescending(item => item.Attachment.CreatedAt)
            .Skip(skip)
            .Take(limit)
            .Select(item => new GetMediaResponseDto(
                item.Message.Id,
                item.Attachment.FileUrl ?? string.Empty,
                item.Attachment.FileType?.ToString() ?? string.Empty,
                item.Attachment.CreatedAt
            ))
            .ToList();
    }

    private static FileType? ResolveMediaType(string? type)
    {
        return type?.Trim().ToLowerInvariant() switch
        {
            "image" => FileType.Image,
            "video" => FileType.Video,
            "audio" => FileType.Audio,
            "document" or "file" => FileType.Document,
            _ => null
        };
    }
    
    /// <summary>
    ///     Searches messages by keyword using MongoDB Text Index on Content.
    ///     Filters by conversation ID and excludes deleted or pending messages.
    /// </summary>
    public async Task<List<MessageResponseDto>> SearchMessagesByKeywordAsync(
        string conversationId,
        string keyword,
        int skip,
        int limit,
        CancellationToken token)
    {
        var filter = Builders<Message>.Filter.And(
            Builders<Message>.Filter.Eq(x => x.ConversationId, conversationId),
            Builders<Message>.Filter.Eq(x => x.IsDeleted, false),
            Builders<Message>.Filter.Eq(x => x.IsPending, false),
            Builders<Message>.Filter.Text(keyword)
        );

        var messages = await DbSet.Find(filter)
            .SortByDescending(x => x.CreatedAt)
            .Skip(skip)
            .Limit(limit)
            .ToListAsync(token);

        return messages.Select(x => x.MapMessageDto()).ToList();
    }

    
    /// <summary>
    ///     Retrieves all direct replies of a message in the same conversation.
    ///     Replies are ordered by creation time ascending.
    /// </summary>
    public async Task<List<MessageResponseDto>> GetRepliesByMessageIdAsync(
        string messageId,
        string conversationId,
        CancellationToken token)
    {
        var messages = await DbSet.AsQueryable()
            .Where(x => x.ReplyToMessageId == messageId
                        && x.ConversationId == conversationId
                        && !x.IsDeleted
                        && !x.IsPending)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(token);

        return messages.Select(x => x.MapMessageDto()).ToList();
    }
}
