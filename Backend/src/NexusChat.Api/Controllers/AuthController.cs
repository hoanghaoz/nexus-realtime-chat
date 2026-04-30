using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NexusChat.Application.DTOs.Authentication;
using NexusChat.Application.Interfaces.Authentication;

namespace NexusChat.Api.Controllers;

/// <summary>
/// Controller for Authentication and Authorization
/// </summary>
/// <remarks>
/// Handles user authentication operations including login and registration.
/// Supports username/password based authentication with JWT token generation.
/// All endpoints are rate-limited per user to prevent abuse.
/// </remarks>
/// <param name="authService">Service for authentication operations</param>
[Route("api/auth")]
[ApiController]
public class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>
    /// Authenticates a user with username and password credentials.
    /// </summary>
    /// <remarks>
    /// Validates the provided username and password against the user database.
    /// Returns a JWT token upon successful authentication.
    /// Rate-limited per user to prevent brute force attacks.
    /// </remarks>
    /// <param name="authDto">The authentication credentials containing username and password.</param>
    /// <param name="token">Cancellation token for the request.</param>
    /// <response code="200">Authentication successful; returns JWT access token.</response>
    /// <response code="401">Unauthorized; username or password is invalid.</response>
    /// <response code="500">Internal server error; failed to process login request.</response>
    /// <returns>An action result containing the JWT token on success, or an error message on failure.</returns>
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
    /// Registers a new user with username and password credentials.
    /// </summary>
    /// <remarks>
    /// Creates a new user account with the provided username and password.
    /// Username must be unique; registration will fail if the username already exists.
    /// Returns a JWT token upon successful registration.
    /// Rate-limited per user to prevent abuse.
    /// </remarks>
    /// <param name="authDto">The registration credentials containing username and password.</param>
    /// <param name="token">Cancellation token for the request.</param>
    /// <response code="200">Registration successful; returns JWT access token.</response>
    /// <response code="409">Conflict; username already exists in the system.</response>
    /// <response code="500">Internal server error; failed to process registration request.</response>
    /// <returns>An action result containing the JWT token on success, or an error message on failure.</returns>
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