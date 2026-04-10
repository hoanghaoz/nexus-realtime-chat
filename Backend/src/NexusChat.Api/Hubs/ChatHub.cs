using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using NexusChat.Application.DTOs.Message;
using NexusChat.Application.Interfaces.Hubs;
using NexusChat.Application.Interfaces.Message;

namespace NexusChat.Api.Hubs;

/// <summary>
///     This class defines methods that the clients call on servers
///     It inherits from the Hub class provided by SignalR, which allows it to manage connections and send messages to
///     clients.
///     The SendMessage method is an example of a method that can be called by clients to send a message to all connected
///     clients.
/// </summary>
[Authorize]
public class ChatHub(IMessageService messageService) : Hub<IChatClient>
{
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    /// <summary>
    ///     This method is call when a user joins a conversation,
    ///     It adds the user from the group and sends a notification to all other users in the conversation
    /// </summary>
    /// <param name="groupName"></param>
    public async Task JoinGroup(string groupName)
    {
        var userJoinedId = Context.UserIdentifier;
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await Clients.OthersInGroup(groupName).NotifyUserJoined(userJoinedId ?? "Unknown", groupName);
    }


    /// <summary>
    ///     This method is call when a user leaves a conversation,
    ///     It removes the user from the group and sends a notification to all other users in the conversation
    /// </summary>
    /// <param name="groupName"></param>
    public async Task LeaveGroup(string groupName)
    {
        var userLeftId = Context.UserIdentifier;
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        await Clients.OthersInGroup(groupName).NotifyUserLeft(userLeftId ?? "Unknown", groupName);
    }

    /// <summary>
    ///     Thí method is call when a user sends a message in a conversation,
    ///     It sends the message to all users in the conversation, including the sender
    /// </summary>
    /// <param name="sendMessageRequestDto"></param>
    /// <param name="token"></param>
    public async Task SendMessage(SendMessageRequestDto sendMessageRequestDto, CancellationToken token)
    {
        var senderId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(senderId)) throw new HubException("User is not authenticated.");

        var result = await messageService.CreateMessageAsync(sendMessageRequestDto, senderId, token);
        if (result.IsError)
        {
            await Clients.Caller.ReceiveErrorMessage(result.Errors.First().Description);
            return;
        }

        if (sendMessageRequestDto.MentionedUsersId != null)
            foreach (var userId in sendMessageRequestDto.MentionedUsersId)
                await Clients.User(userId).UserGotTaggedNotify(result.Value);

        await Clients.Group(sendMessageRequestDto.ConversationId).ReceiveMessage(result.Value);
    }

    /// <summary>
    ///     This method is called when a user tag all members in a conversation
    ///     It sends a notification to all members in group excepts the sender
    /// </summary>
    /// <param name="sendMessageRequestDto"></param>
    /// <param name="token"></param>
    public async Task TagAllMemberInGroup(SendMessageRequestDto sendMessageRequestDto, CancellationToken token)
    {
        var senderId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(senderId)) throw new HubException("User is not authenticated.");

        var result = await messageService.CreateMessageAsync(sendMessageRequestDto, senderId, token);
        if (result.IsError)
        {
            await Clients.Caller.ReceiveErrorMessage(result.Errors[0].Description);
            return;
        }

        await Clients.OthersInGroup(sendMessageRequestDto.ConversationId).ReceiveMessage(result.Value);
    }

    /// <summary>
    ///     This method is called when a user is typing a message in a conversation.
    ///     It sends a notification to all other users in the conversation that the user is typing.
    ///     Frontend will call this method when the user starts typing and stops typing, and the isTyping parameter will
    ///     indicate whether the user is currently typing or not.
    /// </summary>
    /// <param name="conversationId"></param>
    /// <param name="isTyping"></param>
    public async Task SendTypingIndicator(string conversationId, bool isTyping)
    {
        var senderId = Context.UserIdentifier;
        await Clients.OthersInGroup(conversationId).UserTypingNotify(senderId ?? "Unknown", conversationId, isTyping);
    }
}