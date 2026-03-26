using MongoDB.Driver;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Entity.EmbeddedObject;

namespace NexusChat.Infrastructure.Data.Configuration;

/// <summary>
/// Configure index to property for improving performance
/// Index is set to follow E-S-R rule (Equality - Sort - Range)
/// </summary>
public static class MongoIndexConfig
{
    public static async Task CreateIndexAsync(IMongoDatabase database)
    {
        // Schema Conversation index
        var conversation = database.GetCollection<Conversation>("Conversation");
        var conversationIndexKeys = Builders<Conversation>.IndexKeys
            .Descending(cv => cv.CreatedAt);
        var indexConversationOptions = new CreateIndexOptions 
        { 
            Background = true, 
            Name = "idx_created_at_desc" 
        };
        var conversationIndexModel = new CreateIndexModel<Conversation>(conversationIndexKeys,indexConversationOptions);
        await conversation.Indexes.CreateOneAsync(conversationIndexModel);
        
        // Schema Message index
        var message = database.GetCollection<Message>("Message");
        var messageIndexKeys = Builders<Message>.IndexKeys
            .Ascending(ms => ms.ConversationId)
            .Ascending(ms => ms.IsDeleted)
            .Descending(ms => ms.CreatedAt);
        
        var indexMessageOptions = new CreateIndexOptions 
        { 
            Background = true, 
            Name = "idx_conversationId_CreatedAt_IsDeleted"
        };
        
        var messageIndexModel = new CreateIndexModel<Message>(messageIndexKeys,indexMessageOptions);
        await message.Indexes.CreateOneAsync(messageIndexModel);
        
        // User index
        var user = database.GetCollection<User>("User");
        var userIndexKeys = Builders<User>.IndexKeys
            .Descending(ms => ms.CreatedAt);
        var indexUserOptions = new CreateIndexOptions
        {
            Background = true,
            Name = "idx_createdAt"
        };
        var userIndexModel = new CreateIndexModel<User>(userIndexKeys,indexUserOptions);
        await user.Indexes.CreateOneAsync(userIndexModel);
        
        // FriendRequest index
        var friendRequest = database.GetCollection<FriendRequest>("FriendRequest");
        var friendRequestFromIndexKeys = Builders<FriendRequest>.IndexKeys
            .Ascending(ms => ms.FromUserId)
            .Descending(ms => ms.CreatedAt);
        
        var friendRequestToIndexKeys = Builders<FriendRequest>.IndexKeys
            .Ascending(ms => ms.ToUserId)
            .Descending(ms => ms.CreatedAt);

        var indexFriendRequestToOption = new CreateIndexOptions
        {
            Background = true,
            Name = "idx_ToUserId_createdAt"
        };
        
        var indexFriendRequestFromOption = new CreateIndexOptions
        {
            Background = true,
            Name = "idx_FromUserId_createdAt"
        };
        var friendRequestToIndexModel = new CreateIndexModel<FriendRequest>(friendRequestToIndexKeys,indexFriendRequestToOption);
        var friendRequestFromIndexModel = new CreateIndexModel<FriendRequest>(friendRequestFromIndexKeys,indexFriendRequestFromOption);
        await friendRequest.Indexes.CreateManyAsync([friendRequestToIndexModel,friendRequestFromIndexModel]);
        
        // Participants index
        var participant = database.GetCollection<Participant>("Participant");
        var participantIndexKeys = Builders<Participant>.IndexKeys
            .Ascending(ms => ms.UserId)
            .Descending(ms => ms.JoinedAt);
        var indexParticipantOptions = new CreateIndexOptions
        {
            Background = true,
            Name = "idx_UserId_joinedAt"
        };
        var indexParticipantModel = new CreateIndexModel<Participant>(participantIndexKeys,indexParticipantOptions);
        await participant.Indexes.CreateOneAsync(indexParticipantModel);
    }
}