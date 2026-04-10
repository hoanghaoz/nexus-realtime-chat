using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NexusChat.Application.Interfaces.Authentication;
using NexusChat.Domain.Enum;

namespace NexusChat.Infrastructure.Authentication;

public class TokenService(IConfiguration configuration) : ITokenService
{
    public string GenerateToken(string userId, UserRole userRole)
    {
        var secretKey = configuration["Jwt:Key"] ??
                        throw new InvalidOperationException("JWT_KEY is not set in configuration");
        var issue = configuration["Jwt:Issuer"];
        var audience = configuration["Jwt:Audience"];

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Role, userRole.ToString())
        };
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(7),
            Issuer = issue,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}