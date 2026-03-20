using NexusChat.Domain;
using NexusChat.Domain.Enum;

namespace NexusChat.Application.Interfaces.Authentication;

public interface ITokenService
{
    string GenerateToken(string username,UserRole userRole);
}