using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using NexusChat.Application.DTOs.Hubs;
using NexusChat.Application.Interfaces.Hubs;

namespace NexusChat.Api.Hubs;

/// <summary>
/// This class defines methods that the clients call on servers
/// It inherits from the Hub class provided by SignalR, which allows it to manage connections and send messages to clients.
/// The SendMessage method is an example of a method that can be called by clients to send a message to all connected clients.
/// </summary>
[Authorize]
public class ChatHub : Hub<IChatClient>
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        await base.OnConnectedAsync();
    }
    
    public async Task SendMessage()
    {
        var senderId = Context.UserIdentifier;
        var messageDto = new MessageDto(Guid.NewGuid().ToString(), senderId ?? "Unknown", "Hello, World!", "conversationId", DateTime.UtcNow);
        await Clients.All.ReceiveMessage(messageDto);
    }

    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task SendMessageToGroup(string groupName, MessageDto messageDto)
    {
        var senderId = Context.UserIdentifier;
        await Clients.Group(groupName).ReceiveMessage(messageDto);
    }
}