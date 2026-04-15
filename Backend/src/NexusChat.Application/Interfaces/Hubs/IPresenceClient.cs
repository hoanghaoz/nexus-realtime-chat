namespace NexusChat.Application.Interfaces.Hubs;

public interface IPresenceClient
{
    public Task UserOnline(string userId);
    public Task UserOffline(string userId);
}