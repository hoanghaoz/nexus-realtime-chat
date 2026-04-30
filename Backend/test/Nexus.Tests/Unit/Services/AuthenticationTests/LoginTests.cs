using Moq;
using NexusChat.Application.DTOs.Authentication;
using NexusChat.Application.Interfaces.Authentication;
using NexusChat.Application.Interfaces.UserRepository;
using NexusChat.Application.Services;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Enum;

namespace Nexus.Tests.Unit.Services.AuthenticationTests;

public class LoginTests
{
    private readonly AuthService _authService;

    private readonly Mock<IPasswordHasher> _passwordHasher = new();

    private readonly Mock<ITokenService> _tokenService = new();
    private readonly Mock<IUserRepository> _userRepository = new();

    public LoginTests()
    {
        _authService = new AuthService(_passwordHasher.Object, _tokenService.Object, _userRepository.Object);
    }

    [Fact]
    public async Task LoginAsync_WhenUserInformationInvalid_ReturnUnauthorized()
    {
        var fakeUser = BuildUser();

        var fakeRequest = new AuthDto("fakeUser","" ,"fakepass");

        _userRepository.Setup(x => x.GetUserByUsernameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(fakeUser);

        var result = await _authService.LoginAsync(fakeRequest, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal("User.Invalid", result.FirstError.Code);
    }

    [Fact]
    public async Task LoginAsync_WhenUserIsNotExist_ReturnUnauthorized()
    {
        var fakeRequest = new AuthDto("fakeUser","" ,"fakepass");
        _userRepository.Setup(x => x.GetUserByUsernameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var result = await _authService.LoginAsync(fakeRequest, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal("User.Invalid", result.FirstError.Code);
    }

    // test happy path
    [Fact]
    public async Task LoginAsync_WhenUserInformationValid_ReturnOk()
    {
        var fakeUser = BuildUser();
        var fakeRequest = new AuthDto(fakeUser.UserName, "",fakeUser.Password);

        _userRepository.Setup(x => x.GetUserByUsernameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(fakeUser);
        _passwordHasher.Setup(x => x.VerifyPassword(It.IsAny<string>(), It.IsAny<string>())).Returns(true);
        _tokenService.Setup(x => x.GenerateToken(It.IsAny<string>(), It.IsAny<UserRole>())).Returns("fakeToken");

        var result = await _authService.LoginAsync(fakeRequest, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("fakeToken", result.Value);
    }

    private static User BuildUser()
    {
        return new User
        {
            Id = Guid.NewGuid().ToString(),
            UserName = "fakeUser",
            Password = "realPass"
        };
    }
}