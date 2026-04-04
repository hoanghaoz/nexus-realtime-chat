using Microsoft.AspNetCore.SignalR;
using NexusChat.Api.Hubs;
using NexusChat.Application.DTOs.FriendRequests;
using NexusChat.Application.Interfaces.FriendRequests;
using NexusChat.Application.Interfaces.Hubs;

namespace NexusChat.Api.Services;

public class NotificationService(IHubContext<ChatHub, IChatClient> hubContext) : INotificationService
{
    public async Task SendFriendRequestNotificationAsync(string receiverId, FriendRequestDto dto, CancellationToken token)
    {
       await hubContext.Clients.User(receiverId).ReceiveFriendRequest(dto);
    }
}