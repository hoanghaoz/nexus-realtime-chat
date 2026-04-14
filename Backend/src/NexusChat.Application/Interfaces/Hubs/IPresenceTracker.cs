namespace NexusChat.Application.Interfaces.Hubs;

public interface IPresenceTracker
{
    public Task<bool> UserConnected(string userId, string connectionId);
    public Task<bool> UserDisconnected(string userId, string connectionId);
}