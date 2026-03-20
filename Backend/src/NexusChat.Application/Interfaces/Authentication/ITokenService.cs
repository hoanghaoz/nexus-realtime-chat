using NexusChat.Domain;

namespace NexusChat.Application.Interfaces.Authentication;

public interface ITokenService
{
    string GenerateToken(string username,UserRole userRole);
}