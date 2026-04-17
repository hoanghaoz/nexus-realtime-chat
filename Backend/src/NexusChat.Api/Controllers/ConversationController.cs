using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexusChat.Application.DTOs.Conversation;
using NexusChat.Application.Interfaces.ConversationService;

namespace NexusChat.Api.Controllers;

/// <summary>
///     Controller for Conversation Management
/// </summary>
/// <remarks>
///     Handles all conversation-related operations including retrieving conversation lists and searching conversations.
///     Requires user authentication for all operations.
/// </remarks>
/// <param name="conversationService">Service for conversation operations</param>
[Route("api/conversation")]
[ApiController]
[Authorize]
public class ConversationController(
    IConversationService conversationService) : ControllerBase
{
    /// <summary>
    ///     Retrieves the list of conversations for the authenticated user.
    /// </summary>
    /// <remarks>
    ///     Fetches all conversations that the user is a participant of, sorted by last message timestamp.
    ///     Includes conversation metadata such as participants, last message, and online status.
    /// </remarks>
    /// <param name="token">Cancellation token for the request.</param>
    /// <response code="200">Success; returns list of conversations.</response>
    /// <response code="401">Unauthorized; user is not authenticated.</response>
    /// <response code="404">Not found; user does not exist.</response>
    /// <response code="500">Internal server error; failed to retrieve conversations.</response>
    /// <returns>An action result containing the list of conversations on success, or an error message on failure.</returns>
    [HttpGet("list")]
    public async Task<IActionResult> GetConversationList(CancellationToken token)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new
            {
                message = "Invalid token or user not logged in."
            });

        var result = await conversationService.GetConversationListAsync(userId, token);

        var response = result.Match<IActionResult>(
            conversations => Ok(new
            {
                data = conversations,
                message = "Conversations retrieved successfully."
            }),
            errors => errors[0].Code switch
            {
                "Conversation.UserNotFound" => NotFound(new
                {
                    message = "User not found.",
                    description = errors[0].Description
                }),
                _ => StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An error occurred while retrieving conversations. Please try again later.",
                    description = errors[0].Description
                })
            });

        return response;
    }

    /// <summary>
    ///     Searches conversations by keyword.
    /// </summary>
    /// <remarks>
    ///     Searches through all user conversations by conversation name or participant names.
    ///     Returns conversations matching the keyword.
    /// </remarks>
    /// <param name="searchRequest">Request containing the search keyword.</param>
    /// <param name="token">Cancellation token for the request.</param>
    /// <response code="200">Success; returns list of matching conversations.</response>
    /// <response code="400">Bad request; invalid search parameters.</response>
    /// <response code="401">Unauthorized; user is not authenticated.</response>
    /// <response code="404">Not found; user does not exist.</response>
    /// <response code="500">Internal server error; failed to search conversations.</response>
    /// <returns>An action result containing the list of matching conversations on success, or an error message on failure.</returns>
    [HttpGet("search")]
    public async Task<IActionResult> SearchConversation([FromQuery] SearchConversationRequestDto searchRequest,
        CancellationToken token)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new
            {
                message = "Invalid token or user not logged in."
            });

        var result = await conversationService.SearchConversationAsync(userId, searchRequest.Keyword, token);

        var response = result.Match<IActionResult>(
            conversations => Ok(new
            {
                data = conversations,
                message = "Search completed successfully."
            }),
            errors => errors[0].Code switch
            {
                "Conversation.UserNotFound" => NotFound(new
                {
                    message = "User not found.",
                    description = errors[0].Description
                }),
                "Conversation.InvalidKeyword" => BadRequest(new
                {
                    message = "Invalid search keyword.",
                    description = errors[0].Description
                }),
                _ => StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An error occurred while searching conversations. Please try again later.",
                    description = errors[0].Description
                })
            });

        return response;
    }
}

