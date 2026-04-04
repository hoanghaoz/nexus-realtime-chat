using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NexusChat.Application.Interfaces;
using NexusChat.Application.Interfaces.Hubs;

namespace NexusChat.Api.Controllers;

[Route("api/message")]
[ApiController]
public class MessageController(IMessageService messageService) : ControllerBase
{
    
}