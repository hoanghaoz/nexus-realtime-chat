using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NexusChat.Application.DTOs;
using NexusChat.Application.Interfaces.FriendService;

namespace NexusChat.Api.Controllers;

[Route("api/friends-list")]
[ApiController]
[Authorize]
public class FriendListController(IFriendListService friendListService) : ControllerBase
{
    private const string InvalidUserError = "Invalid token or user not logged in.";

    /// <summary>
    /// Retrieves the authenticated user's friend list.
    /// UI: Used to render the main friend panel/sidebar after login.
    /// </summary>
    /// <remarks>
    /// Returns all friends of the current user and includes realtime online status
    /// from the presence tracker.
    /// </remarks>
    /// <param name="token">A cancellation token to observe while waiting for the task to complete.</param>
    /// <response code="200">Success; returns friend list with online/offline state.</response>
    /// <response code="401">Unauthorized; invalid token or user not logged in.</response>
    /// <response code="404">Not found; current user does not exist.</response>
    /// <response code="500">Internal server error; failed to retrieve friend list.</response>
    /// <returns>An action result containing the friend list on success, or an error message on failure.</returns>
    [HttpGet]
    [EnableRateLimiting("limit-per-user")]
    [ProducesResponseType(typeof(List<FriendResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetFriends(CancellationToken token)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = InvalidUserError });

        var result = await friendListService.GetFriendsListAsync(userId, token);

        var response = result.Match<IActionResult>(
            friends => Ok(friends),
            errors => errors[0].Code switch
            {
                "FriendList.UserNotFound" => NotFound(new
                {
                    message = "User not found.",
                    description = errors[0].Description
                }),
                _ => StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An error occurred while retrieving friend list. Please try again later.",
                    description = errors[0].Description
                })
            });

        return response;
    }

    /// <summary>
    /// Searches the authenticated user's friend list by username.
    /// UI: Triggered when typing in the friend search box.
    /// </summary>
    /// <remarks>
    /// Performs case-insensitive matching on friend usernames and returns only
    /// friends that match the provided keyword.
    /// </remarks>
    /// <param name="keyword">The keyword used to search friends by username.</param>
    /// <param name="token">A cancellation token to observe while waiting for the task to complete.</param>
    /// <response code="200">Success; returns matching friends.</response>
    /// <response code="400">Bad request; keyword is empty or invalid.</response>
    /// <response code="401">Unauthorized; invalid token or user not logged in.</response>
    /// <response code="404">Not found; current user does not exist.</response>
    /// <response code="500">Internal server error; failed to search friend list.</response>
    /// <returns>An action result containing matching friends on success, or an error message on failure.</returns>
    [HttpGet("search")]
    [EnableRateLimiting("limit-per-user")]
    [ProducesResponseType(typeof(List<FriendResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SearchFriends([FromQuery] string keyword, CancellationToken token)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = InvalidUserError });

        var result = await friendListService.SearchFriendsAsync(userId, keyword, token)  ;

        var response = result.Match<IActionResult>(
            friends => Ok(friends),
            errors => errors[0].Code switch
            {
                "FriendList.InvalidKeyword" => BadRequest(new
                {
                    message = "Keyword is required.",
                    description = errors[0].Description
                }),
                "FriendList.UserNotFound" => NotFound(new
                {
                    message = "User not found.",
                    description = errors[0].Description
                }),
                _ => StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An error occurred while searching friend list. Please try again later.",
                    description = errors[0].Description
                })
            });

        return response;
    }
}

