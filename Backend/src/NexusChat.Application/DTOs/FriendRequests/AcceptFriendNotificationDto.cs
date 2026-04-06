namespace NexusChat.Application.DTOs.FriendRequests;

public record AcceptFriendNotificationDto(
    string AcceptorId,    
    string AcceptorName,     
    string AcceptorAvatar,   
    DateTime AcceptedAt      
);