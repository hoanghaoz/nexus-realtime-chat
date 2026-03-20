using Microsoft.Extensions.Configuration;
using NexusChat.Application.Interfaces.Authentication;
using NexusChat.Domain;
using NexusChat.Domain.Enum;

namespace NexusChat.Infrastructure.Authentication;

public class TokenService(IConfiguration configuration) : ITokenService
{
    public string GenerateToken(string username, UserRole userRole)
    {
        throw new NotImplementedException();
    }
}
