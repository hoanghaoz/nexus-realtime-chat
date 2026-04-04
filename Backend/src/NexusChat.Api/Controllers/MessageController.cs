using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NexusChat.Api.Hubs;
using NexusChat.Application.DTOs.Message;
using NexusChat.Application.Interfaces;
using NexusChat.Application.Interfaces.Message;

namespace NexusChat.Api.Controllers;

/// <summary>
/// Controller for Message Management
/// </summary>
/// <remarks>
/// Handles all message-related operations including sending, retrieving, and managing messages.
/// Integrates with SignalR for real-time message delivery to connected clients.
/// Requires user authentication for all operations.
/// </remarks>
/// <param name="messageService">Service for message operations</param>
/// <param name="hubContext">Hub context for real-time messaging via SignalR</param>
[Route("api/message")]
[ApiController]
[Authorize("User")]
public class MessageController(
    IMessageService messageService, IHubContext<ChatHub> hubContext) : ControllerBase
{
    /// <summary>
    /// Retrieves messages from a specific conversation with cursor-based pagination.
    /// </summary>
    /// <remarks>
    /// Fetches messages from a conversation using cursor-based pagination for efficient data retrieval.
    /// If no cursor is provided, returns the latest messages from the conversation.
    /// If a cursor is provided, returns messages created before the cursor timestamp.
    /// Includes message metadata such as creation time, edit history, and reactions.
    /// User must be a member of the conversation to retrieve its messages.
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
    
    
}