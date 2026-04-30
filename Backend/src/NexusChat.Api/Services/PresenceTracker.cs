using NexusChat.Application.Interfaces.Hubs;

namespace NexusChat.Api.Services;

/// <summary>
/// Tracks online users and their SignalR connections in-memory.
/// Registered as singleton so state is shared across hub instances.
/// </summary>
public class PresenceTracker : IPresenceTracker
{
    private readonly Dictionary<string, HashSet<string>> _onlineUsers = new();
    private readonly object _sync = new();

    /// <summary>
    /// Registers a user connection.
    /// </summary>
    /// <param name="userId">Connected user id.</param>
    /// <param name="connectionId">SignalR connection id.</param>
    /// <returns><c>true</c> when this is the user's first active connection.</returns>
    public Task<bool> UserConnected(string userId, string connectionId)
    {
        bool isFirstConnection; // check first connection 

        lock (_sync)
        {
            if (!_onlineUsers.TryGetValue(userId, out var connections))
            {
                connections = new HashSet<string>(); 
                _onlineUsers[userId] = connections; 
            }

            connections.Add(connectionId);
            isFirstConnection = connections.Count == 1;
        }

        return Task.FromResult(isFirstConnection);
    }

    /// <summary>
    /// Removes a user connection.
    /// </summary>
    /// <param name="userId">Disconnected user id.</param>
    /// <param name="connectionId">SignalR connection id.</param>
    /// <returns><c>true</c> when the user has no active connections left.</returns>
    public Task<bool> UserDisconnected(string userId, string connectionId)
    {
        bool isLastOffline = false; // check last connection

        lock (_sync)
        {
            if (!_onlineUsers.TryGetValue(userId, out var connections))
            {
                return Task.FromResult(false);
            }

            connections.Remove(connectionId);
            if (connections.Count == 0) // if not device online remove user from online hashset users
            {
                _onlineUsers.Remove(userId);
                isLastOffline = true;
            }
        }

        return Task.FromResult(isLastOffline);
    }

    /// <summary>
    /// Gets all currently online user ids.
    /// </summary>
    /// <returns>Sorted list of online users.</returns>
    public Task<string[]> GetOnlineUsers()
    {
        string[] users;

        lock (_sync)
        {
            users = _onlineUsers.Keys.OrderBy(x => x).ToArray();
        }

        return Task.FromResult(users);
    }

    /// <summary>
    /// Gets active connection ids for a user.
    /// </summary>
    /// <param name="userId">User id to lookup.</param>
    /// <returns>Connection ids for the user, or an empty array.</returns>
    public Task<string[]> GetConnectionsForUser(string userId)
    {
        string[] connections;

        lock (_sync)
        {
            connections = _onlineUsers.TryGetValue(userId, out var activeConnections)
                ? activeConnections.ToArray()
                : [];
        }

        return Task.FromResult(connections);
    }
}
