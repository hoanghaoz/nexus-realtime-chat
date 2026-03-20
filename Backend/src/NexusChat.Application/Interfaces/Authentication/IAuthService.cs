using ErrorOr;

namespace NexusChat.Application.Interfaces.Authentication;

public interface IAuthService
{
    Task<ErrorOr<string>> LoginAsync();

    Task<ErrorOr<Created>> RegisterAsync();
}