using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NexusChat.Api.Hubs;
using NexusChat.Application.DTOs.Message;
using NexusChat.Application.Interfaces;
namespace NexusChat.Api.Controllers;

[Route("api/message")]
[ApiController]
[Authorize("User")]
public class MessageController(
    IMessageService messageService, IHubContext<ChatHub> hubContext) : ControllerBase
{
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
    
    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequestDto messageRequestDto,
        CancellationToken token)
    {
        var userId = HttpContext.User.Identity?.Name;
        if (userId == null)
        {
            return Unauthorized();
        }
        var result = await messageService.CreateMessageAsync(messageRequestDto, userId, token);
        var response = result.Match<IActionResult>(
            message =>
            {
                return Ok(message);
            },
             errors => errors[0].Code switch
            {
                "Conversation.NotFound" => NotFound(new
                {
                    message = "Conversation does not exist or you are not a member of this conversation.",
                    description = errors[0].Description
                }),
                
                "UserId.NotInConversation" => Unauthorized(new
                {
                    message = "You are not a member of this conversation.",
                    description = errors[0].Description
                }),
                _ => StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An error occurred while sending the message. Please try again later.",
                    description = errors[0].Description
                })
            });
        if (!result.IsError)
        {
            // Fire-and-forget to handle real-time message sending to clients in the conversation
            _ = hubContext.Clients.Group(messageRequestDto.ConversationId)
                .SendCoreAsync("ReceiveMessage", [result.Value], CancellationToken.None);
        }
        return response;
    }
}