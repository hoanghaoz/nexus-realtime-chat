using System.Security.Claims;
using ErrorOr;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NexusChat.Application.DTOs.Users;
using NexusChat.Application.Interfaces.UserService;

namespace NexusChat.Api.Controllers;

[Route("api/users")]
[ApiController]
public class UserController(IUserUpdateService userUpdateService, IUserSearchService userSearchService, IUserProfileService userProfileService) : ControllerBase
{
    /// <summary>
    /// Updates user information based on the provided ID and data.
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <param name="updateDto"></param>
    /// <param name="token"></param>
    /// <returns>An IActionResult indicating the result of the operation.</returns>
    [HttpPut("update")]
    [EnableRateLimiting("limit-per-user")]
    public async Task<IActionResult> Update([FromBody] UserUpdateDto updateDto, CancellationToken token)
    {
        // Get ID from Token
        var myUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        // Check ID hacker 
        if (string.IsNullOrWhiteSpace(myUserId))
        {
            return Unauthorized(new { 
                error = "Unauthorized", 
                message = "Token không hợp lệ hoặc không tìm thấy ID của bạn!" 
            });
        }
        var result = await userUpdateService.UpdateUserAsync(myUserId, updateDto, token);

        return result.Match(
            successMesage => Ok(new { message = successMesage }),
            MapErrorToProblem
        );
    }
    /// <summary>
    /// Xem profile dua tren ID
    /// </summary>
    [HttpGet("{id}/profile")]
    [EnableRateLimiting("limit-per-user")]
    [ProducesResponseType(typeof(UserProfileResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfile(string id, CancellationToken token)
    {
        var result = await userProfileService.GetUserProfileAsync(id, token);

        return result.Match(
            profile => Ok(profile),
            MapErrorToProblem
        );
    }
    /// <summary>
    /// Search users by username.
    /// </summary>
    /// <param name="name">Username to search for.</param>
    /// <param name="token"></param>
    /// <returns>A list of matching users.</returns>
    [HttpGet("search")]
    [EnableRateLimiting("limit-per-user")]
    [ProducesResponseType(typeof(List<UserSearchResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchUsers([FromQuery] string name, CancellationToken token)
    {
        var result = await userSearchService.SearchUsersByNameAsync(name, token);

        return result.Match(
            users => Ok(users),
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
        return Problem(statusCode: statusCode, detail: firstError.Description);
    }
}