using ErrorOr;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NexusChat.Application.DTOs.Users;
using NexusChat.Application.Interfaces.UserService;

namespace NexusChat.Api.Controllers;

/// <summary>
/// Controller for User Management
/// </summary>
/// <remarks>
/// Handles user profile and account management operations.
/// Supports updating user information and profile details.
/// Requires user authentication for all operations.
/// All endpoints are rate-limited per user to prevent abuse.
/// </remarks>
/// <param name="userUpdateService">Service for user update operations</param>
[Route ("api/users")]
[ApiController]
public class UserController(IUserUpdateService userUpdateService) : ControllerBase 
{
    /// <summary>
    /// Updates user profile information.
    /// </summary>
    /// <remarks>
    /// Updates various user profile fields such as display name, email, avatar, and other metadata.
    /// Only authenticated users can update their own profile.
    /// All updates are applied immediately and persisted to the database.
    /// Rate-limited per user to prevent abuse.
    /// </remarks>
    /// <param name="userId">The unique identifier of the user whose profile is being updated.</param>
    /// <param name="updateDto">Data transfer object containing the fields to be updated.</param>
    /// <param name="token">Cancellation token for the request.</param>
    /// <response code="200">Success; user profile updated successfully.</response>
    /// <response code="400">Bad request; validation failed for the provided update data.</response>
    /// <response code="401">Unauthorized; user is not authenticated or attempting to update another user's profile.</response>
    /// <response code="404">Not found; user with the specified ID does not exist.</response>
    /// <response code="409">Conflict; update conflicts with existing data (e.g., duplicate email).</response>
    /// <response code="500">Internal server error; failed to update user profile.</response>
    /// <returns>An action result containing a success message on success, or an error message on failure.</returns>
    [HttpPut("update")]
    [EnableRateLimiting("limit-per-user")]
    public async Task<IActionResult> Update(string userId, [FromBody] UserUpdateDto updateDto, CancellationToken token)
    {
        var result = await userUpdateService.UpdateUserAsync(userId, updateDto, token);

        return result.Match(
            successMesage => Ok(new { message = successMesage }),
            MapErrorToProblem
        );
    }

    private IActionResult MapErrorToProblem(List<Error> errors)
    {
        var firstError = errors[0];
        var statusCode = firstError.Type switch
        {
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            _ => StatusCodes.Status500InternalServerError
        };
        return  Problem(statusCode: statusCode, detail: firstError.Description);
    }
}