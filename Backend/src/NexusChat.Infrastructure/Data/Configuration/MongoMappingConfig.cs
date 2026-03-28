using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.IdGenerators;
using MongoDB.Bson.Serialization.Serializers;
using NexusChat.Domain.Common;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Entity.EmbeddedObject;

namespace NexusChat.Infrastructure.Data.Configuration;

public static class MongoMappingConfig
{
    public static void Register()
    {
        BsonClassMap.RegisterClassMap<Entity<string>>(cm =>
        {
            cm.AutoMap();
            
            cm.MapIdProperty(c => c.Id).SetSerializer(new StringSerializer(BsonType.ObjectId))
                .SetIdGenerator(new StringObjectIdGenerator());
        });
        BsonClassMap.RegisterClassMap<Message>(cm =>
        {
            // mapping class property to schema
            cm.AutoMap();
            
            cm.MapProperty(c => c.FromUserId).SetSerializer(new StringSerializer(BsonType.ObjectId));
            
            cm.MapProperty(c => c.ConversationId).SetSerializer(new StringSerializer(BsonType.ObjectId));
        });

        BsonClassMap.RegisterClassMap<User>(cm =>
        {
            cm.AutoMap();

            cm.MapProperty(c => c.Friends).SetSerializer(
                new EnumerableInterfaceImplementerSerializer<List<string>, string>(
                    new StringSerializer(BsonType.ObjectId)));
        });

        BsonClassMap.RegisterClassMap<Conversation>(cm =>
        {
            cm.AutoMap();
            
            cm.MapProperty(c => c.CreatedBy).SetSerializer(new StringSerializer(BsonType.ObjectId));
        });

        BsonClassMap.RegisterClassMap<FriendRequest>(cm =>
        {
            cm.AutoMap();
            
            cm.MapProperty(c => c.FromUserId).SetSerializer(new StringSerializer(BsonType.ObjectId));
            
            cm.MapProperty(c => c.ToUserId).SetSerializer(new StringSerializer(BsonType.ObjectId));
        });

        BsonClassMap.RegisterClassMap<LastMessage>(cm =>
        {
            cm.AutoMap();
            
            cm.MapProperty(c => c.SenderId).SetSerializer(new StringSerializer(BsonType.ObjectId));
        });

        BsonClassMap.RegisterClassMap<Participant>(cm =>
        {
            cm.AutoMap();
            
            cm.MapProperty(c => c.UserId).SetSerializer(new StringSerializer(BsonType.ObjectId));
        });
    }
}