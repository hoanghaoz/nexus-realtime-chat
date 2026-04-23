using Moq;
using NexusChat.Application.DTOs.Authentication;
using NexusChat.Application.Interfaces.Authentication;
using NexusChat.Application.Interfaces.UserRepository;
using NexusChat.Application.Services;
using NexusChat.Domain.Enum;

namespace Nexus.Tests.Unit.Services.AuthenticationTests;

public class RegisterTests
{
    private readonly AuthService _authService;

    private readonly Mock<IPasswordHasher> _passwordHasher = new();

    private readonly Mock<ITokenService> _tokenService = new();
    private readonly Mock<IUserRepository> _userRepository = new();

    public RegisterTests()
    {
        _authService = new AuthService(_passwordHasher.Object, _tokenService.Object, _userRepository.Object);
    }

    [Fact]
    public async Task RegisterAsync_UserIsExist_ReturnConflict()
    {
        var fakeRequest = new AuthDto("fakeUser", "", "fakepass");
        _userRepository.Setup(x => x.IsUsernameExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await _authService.RegisterAsync(fakeRequest, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal("User.UsernameExist", result.FirstError.Code);
    }

    [Fact]
    public async Task RegisterAsync_UserIsNotExist_ReturnJwtToken()
    {
        var fakeRequest = new AuthDto("fakeUser", "", "fakepass");
        _userRepository.Setup(x => x.IsUsernameExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _tokenService.Setup(x => x.GenerateToken(It.IsAny<string>(), It.IsAny<UserRole>()))
            .Returns("fakeJwtToken");

        var result = await _authService.RegisterAsync(fakeRequest, CancellationToken.None);
        Assert.False(result.IsError);
        Assert.Equal("fakeJwtToken", result.Value);
    }
}