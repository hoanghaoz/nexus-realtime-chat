using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexusChat.Application.DTOs.Message;
using NexusChat.Application.Interfaces.Message;

namespace NexusChat.Api.Controllers;

/// <summary>
///     Controller for Message Management
/// </summary>
/// <remarks>
///     Handles all message-related operations including sending, retrieving, and managing messages.
///     Integrates with SignalR for real-time message delivery to connected clients.
///     Requires user authentication for all operations.
/// </remarks>
/// <param name="messageService">Service for message operations</param>
[Route("api/message")]
[ApiController]
[Authorize]
public class MessageController(
    IMessageService messageService) : ControllerBase
{
    /// <summary>
    ///     Retrieves messages from a specific conversation with cursor-based pagination.
    /// </summary>
    /// <remarks>
    ///     Fetches messages from a conversation using cursor-based pagination for efficient data retrieval.
    ///     If no cursor is provided, returns the latest messages from the conversation.
    ///     If a cursor is provided, returns messages created before the cursor timestamp.
    ///     Includes message metadata such as creation time, edit history, and reactions.
    ///     User must be a member of the conversation to retrieve its messages.
    /// </remarks>
    /// <param name="messageRequestDto">Request containing conversation ID and optional cursor for pagination.</param>
    /// <param name="token">Cancellation token for the request.</param>
    /// <response code="200">Success; returns list of messages from the conversation.</response>
    /// <response code="404">Not found; conversation does not exist or user is not a member.</response>
    /// <response code="500">Internal server error; failed to retrieve messages.</response>
    /// <returns>An action result containing the list of messages on success, or an error message on failure.</returns>
    [HttpGet("conversation-messages")]
    public async Task<IActionResult> GetMessagesFromConversation([FromQuery] MessageRequestDto messageRequestDto,
        CancellationToken token)
    {
        var result = await messageService.GetMessageInConversationAsync(messageRequestDto, token);

        var response = result.Match<IActionResult>(
            messages => Ok(messages),
            errors => errors[0].Code switch
            {
                "Conversation.NotFound" => NotFound(new
                {
                    message = "Conversation does not exist or you are not a member of this conversation.",
                    description = errors[0].Description
                }),
                _ => StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An error occurred while retrieving messages. Please try again later.",
                    description = errors[0].Description
                })
            });
        return response;
    }

    /// <summary>
    ///     Edits the content of an existing message.
    /// </summary>
    /// <remarks>
    ///     Allows a user to update the content of their own message.
    ///     Only the message creator can edit their messages.
    ///     The edited message will be marked with an edit timestamp and edit history.
    ///     Message ID is passed as a route parameter, and the new content is provided in the request body.
    /// </remarks>
    /// <param name="editMessageRequestDto">Request containing the new message content.</param>
    /// <param name="messageId">The unique identifier of the message to edit.</param>
    /// <param name="token">Cancellation token for the request.</param>
    /// <response code="200">Success; returns the updated message with edit information.</response>
    /// <response code="401">Unauthorized; invalid token or user not logged in.</response>
    /// <response code="404">Not found; message does not exist.</response>
    /// <response code="403">Forbidden; user is not the owner of the message.</response>
    /// <response code="500">Internal server error; failed to edit the message.</response>
    /// <returns>An action result containing the updated message on success, or an error message on failure.</returns>
    [HttpPut("edit/{messageId}")]
    public async Task<IActionResult> EditMessage([FromBody] EditMessageRequestDto editMessageRequestDto,
        string messageId, CancellationToken token)
    {
        var fromUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(fromUserId))
            return Unauthorized(new
            {
                message = "Invalid token or user not logged in."
            });
        var result = await messageService.EditMessageContentAsync(editMessageRequestDto, fromUserId, messageId, token);

        var response = result.Match<IActionResult>(
            updatedMessage => Ok(updatedMessage),
            errors => errors[0].Code switch
            {
                "Message.NotFound" => NotFound(new
                {
                    message = "Message not found.",
                    description = errors[0].Description
                }),
                "Message.Forbidden" => StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = "You can only modify your own messages.",
                    description = errors[0].Description
                }),
                _ => StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An error occurred while editing the message. Please try again later.",
                    description = errors[0].Description
                })
            });
        return response;
    }

    /// <summary>
    ///     Adds or updates a reaction to a message.
    /// </summary>
    /// <remarks>
    ///     Allows a user to add a new reaction (emoji) to a message or update an existing reaction.
    ///     Multiple users can react to the same message with different or the same emojis.
    ///     If a user already has a reaction on a message, their reaction will be updated.
    ///     Message ID is passed as a route parameter, and the reaction details are provided in the request body.
    /// </remarks>
    /// <param name="messageId">The unique identifier of the message to react to.</param>
    /// <param name="reactMessageRequestDto">Request containing the reaction emoji or type.</param>
    /// <param name="token">Cancellation token for the request.</param>
    /// <response code="200">Success; returns the updated reaction information.</response>
    /// <response code="401">Unauthorized; invalid token or user not logged in.</response>
    /// <response code="404">Not found; message does not exist.</response>
    /// <response code="500">Internal server error; failed to process the reaction.</response>
    /// <returns>An action result containing the reaction data on success, or an error message on failure.</returns>
    [HttpPut("react/{messageId}")]
    public async Task<IActionResult> ReactMessage(string messageId,
        [FromBody] ReactMessageRequestDto reactMessageRequestDto,
        CancellationToken token)
    {
        var fromUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(fromUserId))
            return Unauthorized(new
            {
                message = "Invalid token or user not logged in."
            });

        var result =
            await messageService.ReactMessageContentAsync(reactMessageRequestDto, fromUserId, messageId, token);

        var response = result.Match<IActionResult>(
            reactMessage => Ok(new
            {
                message = "Reaction updated successfully.",
                data = reactMessage
            }),
            errors => errors[0].Code switch
            {
                "Message.NotFound" => NotFound(new
                {
                    message = "Message not found.",
                    description = errors[0].Description
                }),
                _ => StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An error occurred while reacting to the message. Please try again later.",
                    description = errors[0].Description
                })
            });
        return response;
    }

    /// <summary>
    ///     Deletes an existing message.
    /// </summary>
    /// <remarks>
    ///     Allows a user to permanently delete their own message from a conversation.
    ///     Only the message creator can delete their messages.
    ///     Once deleted, the message cannot be recovered.
    ///     Message ID is passed as a route parameter.
    /// </remarks>
    /// <param name="messageId">The unique identifier of the message to delete.</param>
    /// <param name="token">Cancellation token for the request.</param>
    /// <response code="200">Success; message deleted successfully.</response>
    /// <response code="401">Unauthorized; invalid token or user not logged in.</response>
    /// <response code="404">Not found; message does not exist.</response>
    /// <response code="403">Forbidden; user is not the owner of the message.</response>
    /// <response code="500">Internal server error; failed to delete the message.</response>
    /// <returns>An action result containing a success message on success, or an error message on failure.</returns>
    [HttpDelete("{messageId}")]
    public async Task<IActionResult> DeleteMessage(string messageId, CancellationToken token)
    {
        var fromUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(fromUserId))
            return Unauthorized(new
            {
                message = "Invalid token or user not logged in."
            });

        var result = await messageService.DeleteMessageContentAsync(messageId, fromUserId, token);

        var response = result.Match<IActionResult>(
            _ => Ok(new
            {
                message = "Message deleted successfully."
            }),
            errors => errors[0].Code switch
            {
                "Message.NotFound" => NotFound(new
                {
                    message = "Message not found.",
                    description = errors[0].Description
                }),
                "Message.Forbidden" => StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = "You can only delete your own messages.",
                    description = errors[0].Description
                }),
                _ => StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An error occurred while deleting the message. Please try again later.",
                    description = errors[0].Description
                })
            });
        return response;
    }
}