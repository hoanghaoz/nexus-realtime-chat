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
        await base.OnConnectedAsync();
    }
    
    public async Task SendMessage()
    {
        var senderId = Context.UserIdentifier;
        var messageDto = new MessageDto(Guid.NewGuid().ToString(), senderId ?? "Unknown", "Hello, World!", "conversationId", DateTime.UtcNow);
        await Clients.All.ReceiveMessage(messageDto);
    }
    
    /// <summary>
    /// This method is call when a user joins a conversation,
    /// It adds the user from the group and sends a notification to all other users in the conversation 
    /// </summary>
    /// <param name="groupName"></param>
    public async Task JoinGroup(string groupName)
    {
        var userJoinedId = Context.UserIdentifier;
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await Clients.OthersInGroup(groupName).NotifyUserJoined(userJoinedId ?? "Unknown", groupName);
    }
    
    
    /// <summary>
    /// This method is call when a user leaves a conversation,
    /// It removes the user from the group and sends a notification to all other users in the conversation 
    /// </summary>
    /// <param name="groupName"></param>
    public async Task LeaveGroup(string groupName)
    {
        var userLeftId = Context.UserIdentifier;
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        await Clients.OthersInGroup(groupName).NotifyUserLeft(userLeftId ?? "Unknown", groupName);
    }
    
    /// <summary>
    /// Thí method is call when a user sends a message in a conversation,
    /// It sends the message to all users in the conversation, including the sender
    /// </summary>
    /// <param name="groupName"></param>
    /// <param name="message"></param>
    public async Task SendMessageToGroup(string groupName,string message)
    {
        var senderId = Context.UserIdentifier;
        var messageDto = new MessageDto(
            Guid.NewGuid().ToString(),
            senderId ?? "Unknown", 
            message, 
            groupName, 
            DateTime.UtcNow);
        await Clients.Group(groupName).ReceiveMessage(messageDto);
    }   
    
    /// <summary>
    /// This method is called when a user tag all members in a conversation
    /// It sends a notification to all members in group excepts the sender
    /// </summary>
    /// <param name="groupName"></param>
    public async Task TagAllMemberInGroup(string groupName)
    {
        var senderId = Context.UserIdentifier;
        var message = new MessageDto(
            Guid.NewGuid().ToString(),
            senderId ?? "System", 
            $"You have been tagged in {groupName}!",
            groupName,
            DateTime.UtcNow);
        await Clients.OthersInGroup(groupName).ReceiveMessage(message);
    }
    
    /// <summary>
    /// This method is called when a user is typing a message in a conversation.
    /// It sends a notification to all other users in the conversation that the user is typing.
    /// Frontend will call this method when the user starts typing and stops typing, and the isTyping parameter will indicate whether the user is currently typing or not.
    /// </summary>
    /// <param name="conversationId"></param>
    /// <param name="isTyping"></param>
    public async Task TypingIndicator(string conversationId, bool isTyping)
    {
        var senderId = Context.UserIdentifier;
        await Clients.OthersInGroup(conversationId).UserTyping(senderId ?? "Unknown", conversationId, isTyping);
    }
    
    
    /// <summary>
    /// This method is called when a user is tagged in a message in a conversation.
    /// It sends a notification to the tagged user that they have been tagged in a message,
    /// Also sends a message to all other users in the conversation that the user has been tagged in a message,
    /// so that they can see the message in the conversation and know that the user has been tagged.
    /// </summary>
    /// <param name="groupName"></param>
    /// <param name="userId"></param>
    /// <param name="message"></param>
    public async Task TagUserInGroup(string groupName, string userId,string message)
    {
        var senderId = Context.UserIdentifier;
        var messageDto = new MessageDto
        (
            Guid.NewGuid().ToString(),
            senderId ?? "Unknown",
            message,
            groupName,
            DateTime.UtcNow
        );
        
        // send a message to the conversation
        await Clients.OthersInGroup(groupName).ReceiveMessage(messageDto);
        
        // send a notification to the user has been tagged
        await Clients.User(userId).UserGotTagged(messageDto);
    }
}