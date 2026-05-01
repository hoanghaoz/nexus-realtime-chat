using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using NexusChat.Application.DTOs.Media;
using NexusChat.Application.DTOs.Message;
using NexusChat.Application.Extension;
using NexusChat.Application.Interfaces.Message;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Entity.EmbeddedObject;
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

    public async Task<List<MediaResponseDto>> GetMediaByConversationIdAsync(string conversationId, string? type, int skip, int limit, CancellationToken token)
    {
        //Filter messages by conversationId and attachments exist,
        //then unwind attachments to get each attachment as a separate document,
        //then filter by type if provided,
        //then skip and limit for pagination
        var documentPipeline = DbSet.Aggregate()
            .Match(m => m.ConversationId == conversationId
                        && m.IsDeleted == false
                        && m.Attachments.Any())
            .Unwind(m => m.Attachments)
            .As<BsonDocument>();
        
        //Get only FileAttachment , discard LinkPreviewAttachment
        // Because we only want to get media,
        // and LinkPreviewAttachment is not media,
        // it's just a preview of a link
        var onlyFilesFilter = Builders<BsonDocument>.Filter.Exists("Attachments.FileUrl");
         documentPipeline = documentPipeline.Match(onlyFilesFilter);
         
         // Continue filter by type if type is provided from FE 
         if (!string.IsNullOrEmpty(type))
         {
             var typeFilter = Builders<BsonDocument>.Filter.Eq("Attachments.FileType", type);
             documentPipeline = documentPipeline.Match(typeFilter);
         }
         
         // Sort , Paging and map to MediaResponseDto
         var result = await documentPipeline
             .Sort(Builders<BsonDocument>.Sort.Descending("CreatedAt"))
             .Skip(skip)
             .Limit(limit)
             .Project(bson => new MediaResponseDto(
                 bson["_id"].AsString,
                 bson["Attachments"]["FileUrl"].AsString,  
                 bson["Attachments"]["FileType"].AsString,
                 bson["CreatedAt"].ToUniversalTime()
             ))
             .ToListAsync(token);

         return result;
    }
}