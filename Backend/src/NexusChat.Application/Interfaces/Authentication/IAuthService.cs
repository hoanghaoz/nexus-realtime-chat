using ErrorOr;
using NexusChat.Application.DTOs.Authentication;

namespace NexusChat.Application.Interfaces.Authentication;

public interface IAuthService
{
    Task<ErrorOr<string>> LoginAsync(AuthDto authDto, CancellationToken token);

    Task<ErrorOr<string>> RegisterAsync(AuthDto authDto, CancellationToken token);
}