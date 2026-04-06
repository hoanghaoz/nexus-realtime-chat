using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NexusChat.Application.DTOs.Authentication;
using NexusChat.Application.Interfaces.Authentication;

namespace NexusChat.Api.Controllers;

/// <summary>
/// Controller for Authentication
/// </summary>
/// <param name="authService"></param>
[Route("api/auth")]
[ApiController]
public class AuthController(IAuthService authService) : ControllerBase
{
    ///  <summary>
    ///  Login user with username and password, return JWT token if successful
    ///  </summary>
    ///  <param name="authDto"></param>
    ///  <param name="token"></param>
    ///  <returns>
    /// <response code="200">Return JWT token if login is successful</response>
    /// <response code="401">Return error message if username or password is invalid</response>
    ///  </returns>
    [HttpPost("login")]
    [EnableRateLimiting("limit-per-user")]
    public async Task<IActionResult> Login(AuthDto authDto, CancellationToken token)
    {
        var result = await authService.LoginAsync(authDto, token);
        var response = result.Match(
            jwtToken => Ok(new
            {
                accessToken = jwtToken
            }),
            error => error[0].Code switch
            {
                "User.Invalid" => Unauthorized(error[0].Description),
                _ => StatusCode(StatusCodes.Status500InternalServerError, error[0].Description)
            });
        
        return response;
    }
    
    /// <summary>
    /// Register with username and password
    /// </summary>
    /// <param name="authDto"></param>
    /// <param name="token"></param>
    /// <returns>
    ///<response code="200">Return JWT token if registration is successful</response>
    ///<response code="409">Return error message if username already exists</response>
    /// </returns>
    [HttpPost("register")]
    [EnableRateLimiting("limit-per-user")]
    public async Task<IActionResult> Register(AuthDto authDto, CancellationToken token)
    {
        var result = await authService.RegisterAsync(authDto, token);
        var response = result.Match(
            jwtToken => Ok(new
            {
                accessToken = jwtToken
            }),
            error => error[0].Code switch
            {
                "User.UsernameExist" => Conflict(error[0].Description),
                _ => StatusCode(StatusCodes.Status500InternalServerError, error[0].Description)
            });
        return response;
    }
}