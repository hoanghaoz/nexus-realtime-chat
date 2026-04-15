using NexusChat.Application.DTOs.FriendRequests;

namespace NexusChat.Application.Interfaces.FriendRequests;

public interface INotificationService
{
    Task SendFriendRequestNotificationAsync(string receiverId, FriendRequestDto dto,  CancellationToken token);
    Task SendAcceptFriendNotificationAsync(string receiverId, AcceptFriendNotificationDto dto, CancellationToken token);
}