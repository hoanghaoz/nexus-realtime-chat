using ErrorOr;
using NexusChat.Application.DTOs.Authentication;
using NexusChat.Application.Interfaces.Authentication;
using NexusChat.Application.Interfaces.UserRepository;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Enum;

namespace NexusChat.Application.Services;

public class AuthService(
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    IUserRepository userRepository) : IAuthService
{
    public async Task<ErrorOr<string>> LoginAsync(AuthDto authDto,CancellationToken token)
    {
        var correctUser = await userRepository.GetUserByUsernameAsync(authDto.Username,token);
        if (correctUser == null || !passwordHasher.VerifyPassword(authDto.Password,correctUser.Password))
        {
            return Error.Unauthorized("User.Invalid","Invalid username or password");
        }
        var jwtToken = tokenService.GenerateToken(correctUser.Id,UserRole.User);
        return jwtToken;
    }

    public async Task<ErrorOr<string>> RegisterAsync(AuthDto authDto,CancellationToken token)
    {
        var existUsername = await userRepository.IsUsernameExistsAsync(authDto.Username, token);
        if (existUsername)
        {
            return Error.Conflict("User.UsernameExist","Username already exists");
        }
        var passwordHash =  passwordHasher.HashPassword(authDto.Password);
        var newUser = new User
        {
            UserName = authDto.Username,
            Password = passwordHash,
            Status = UserStatus.Online,
            CreatedAt = DateTime.UtcNow
        };
        await userRepository.AddAsync(newUser,token);
        var jwtToken =tokenService.GenerateToken(newUser.Id,UserRole.User);
        return jwtToken;
    }
}