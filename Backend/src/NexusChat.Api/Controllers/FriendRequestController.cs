using System.Security.Claims;
using ErrorOr;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NexusChat.Application.DTOs.FriendRequests;
using NexusChat.Application.Interfaces.FriendRequests;
using NexusChat.Application.Interfaces.FriendService;

namespace NexusChat.Api.Controllers;

[Route("api/friend-requests")]
[ApiController]
[Authorize] // Enforce authentication for all endpoints in this controller
public class FriendRequestsController(IFriendRequestService friendRequestService) : ControllerBase
{
    private const string InvalidUserError = "Invalid token or user not logged in.";
    /// <summary>
    /// Checks the friendship status between the current user and the target user.
    /// Used to determine the UI button state (e.g., "Add Friend", "Pending", or "Friend").
    /// </summary>
    /// <param name="receiverId">The ID of the user being viewed.</param>
    /// <param name="token">A cancellation token to observe while waiting for the task to complete.</param>
    /// <returns>Returns a string status: "None", "Pending", or "Friend".</returns>
    [HttpGet("status/{receiverId}")]
    [EnableRateLimiting("limit-per-user")]
    public async Task<IActionResult> GetFriendshipStatus(string receiverId, CancellationToken token)
    {
        // The user initiating the check acts as the Sender
        var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(senderId))
        {
            return Unauthorized(new { message = InvalidUserError });
        }

        var result = await friendRequestService.CheckFriendshipStatusAsync(senderId, receiverId, token);

        return result.Match(
            onValue: status => Ok(new { status }),
            onError: MapErrorToProblem 
        );
    }

    /// <summary>
    /// Sends a new friend request to another user.
    /// UI: Triggered when the user clicks the "Add Friend" button.
    /// Note: Includes a 7-day cooldown if a previous request was rejected.
    /// </summary>
    /// <param name="dto">The target user's ID.</param>
    /// <param name="token">A cancellation token to observe while waiting for the task to complete.</param>
    /// <returns>A success message if the request is sent or re-activated.</returns>
    [HttpPost]
    [EnableRateLimiting("limit-per-user")]
    public async Task<IActionResult> SendRequest([FromBody] CreateFriendRequestDto dto, CancellationToken token)
    {
        // The user sending the friend request acts as the Sender
        var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(senderId))
        {
            return Unauthorized(new { message = InvalidUserError });
        }

        var result = await friendRequestService.SendRequestAsync(senderId, dto, token);

        return result.Match(
            onValue: message => Ok(new { message }),
            onError: MapErrorToProblem
        );
    }

    /// <summary>
    /// Accepts a pending friend request.
    /// UI: Triggered when clicking "Confirm/Accept" in the notification or friend list.
    /// Result: Both users are added to each other's "Friends" list.
    /// </summary>
    /// <param name="requestId">The unique ID of the friend request.</param>
    /// <param name="token">A cancellation token to observe while waiting for the task to complete.</param>
    [HttpPut("{requestId}/accept")]
    [EnableRateLimiting("limit-per-user")]
    public async Task<IActionResult> AcceptRequest(string requestId, CancellationToken token)
    {
        // The user accepting the request acts as the Receiver
        var receiverId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(receiverId))
        {
            return Unauthorized(new { message = InvalidUserError });
        }

        var result = await friendRequestService.AcceptRequestAsync(requestId, receiverId, token);

        return result.Match(
            onValue: message => Ok(new { message }),
            onError: MapErrorToProblem
        );
    }

    /// <summary>
    /// Rejects a pending friend request.
    /// UI: Triggered when clicking "Delete/Decline" in the notification or friend list.
    /// Result: Status changes to "Reject", triggering a cooldown for the sender.
    /// </summary>
    /// <param name="requestId">The unique ID of the friend request.</param>
    /// <param name="token">A cancellation token to observe while waiting for the task to complete.</param>
    [HttpPut("{requestId}/decline")]
    [EnableRateLimiting("limit-per-user")]
    public async Task<IActionResult> DeclineRequest(string requestId, CancellationToken token)
    {
        // The user declining the request acts as the Receiver
        var receiverId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(receiverId))
        {
            return Unauthorized(new { message = InvalidUserError});
        }

        var result = await friendRequestService.DeclineRequestAsync(requestId, receiverId, token);

        return result.Match(
            onValue: message => Ok(new { message }),
            onError: MapErrorToProblem
        );
    }

    /// <summary>
    /// Gets all incoming friend requests that are currently "Waiting".
    /// UI: Used to populate the "Friend Requests" or "Notifications" tab.
    /// </summary>
    /// <returns>A list of friend requests with sender info (Name, Avatar, ID).</returns>
    [HttpGet("pending")]
    [EnableRateLimiting("limit-per-user")]
    public async Task<IActionResult> GetPendingRequests(CancellationToken token)
    {
        // The user viewing the pending list acts as the Receiver
        var receiverId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(receiverId))
        {
            return Unauthorized(new { message = InvalidUserError });
        }

        var result = await friendRequestService.GetPendingRequestsAsync(receiverId, token);

        return result.Match(
            onValue: requests => Ok(requests),
            onError: MapErrorToProblem
        );
    }

    /// <summary>
    /// Maps a list of ErrorOr errors to the appropriate HTTP ProblemDetails response.
    /// </summary>
    private IActionResult MapErrorToProblem(List<Error> errors)
    {
        var firstError = errors[0];

        var statusCode = firstError.Type switch
        {
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            _ => StatusCodes.Status500InternalServerError
        };

        return Problem(statusCode: statusCode, title: firstError.Description);
    }
}