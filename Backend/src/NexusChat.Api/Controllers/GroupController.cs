using ErrorOr;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NexusChat.Api.Hubs;
using NexusChat.Application.DTOs.Rooms;
using NexusChat.Application.Interfaces.Hubs;
using NexusChat.Application.Interfaces.RoomService;
using System.Security.Claims;

namespace NexusChat.Api.Controllers;

[Route("api/groups")]
[ApiController]
[Authorize]
public class GroupController(
    IGroupService groupService,
    IHubContext<ChatHub, IChatClient> hubContext) : ControllerBase
{
    [HttpPost("create")]
    public async Task<IActionResult> CreateGroup(CreateGroupRequestDto dto, CancellationToken token)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await groupService.CreateGroupAsync(userId, dto, token);
        if (result.IsError)
        {
            return MapErrorToProblem(result.Errors);
        }

        var group = result.Value;

        var allUserIdsToNotify = new List<string>(dto.ParticipantIds) { userId };

        await hubContext.Clients.Users(allUserIdsToNotify)
            .ReceiveAddedToGroupNotification(group);

        return Ok(group);
    }

    private IActionResult MapErrorToProblem(List<Error> errors)
    {
        var firstError = errors[0];
        var statusCode = firstError.Type switch
        {
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            _ => StatusCodes.Status500InternalServerError
        };
        return Problem(statusCode: statusCode, detail: firstError.Description);
    }
}