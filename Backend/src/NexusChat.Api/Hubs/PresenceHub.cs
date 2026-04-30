using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using NexusChat.Application.Interfaces.Hubs;
namespace NexusChat.Api.Hubs;

[Authorize]
public class PresenceHub(IPresenceTracker presenceTracker)  : Hub<IPresenceClient>
{
    /// <summary>
    /// Invoked when a new connection is established with the hub.
    /// Tracks the user's connection and broadcasts an online status update if it's their first active connection.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrWhiteSpace(userId))
        {
            var isOnline = await presenceTracker.UserConnected(userId, Context.ConnectionId);
            if (isOnline)
            {
                await Clients.Others.UserOnline(userId);
            }
        }

        await base.OnConnectedAsync();
    }
    /// <summary>
    /// Invoked when a connection with the hub is terminated.
    /// Removes the connection from the tracker and broadcasts an offline status update if no other active connections remain for the user.
    /// </summary>
    /// <param name="exception">The exception that occurred, if any, which caused the disconnection.</param>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrWhiteSpace(userId))
        {
            var isOffline = await presenceTracker.UserDisconnected(userId, Context.ConnectionId);
            if (isOffline)
            {
                await Clients.Others.UserOffline(userId);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }
    /// <summary>
    /// Retrieves a list of all currently online user identifiers.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains an array of online user IDs.</returns>
    public async Task<string[]> GetOnlineUsers()
    {
        return await presenceTracker.GetOnlineUsers();
    }
}