using System.Security.Claims;
using ErrorOr;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexusChat.Application.DTOs.Media;
using NexusChat.Application.Interfaces.Media;

namespace NexusChat.Api.Controllers;

[Route("api/media")]
[ApiController]
[Authorize]
public class MediaController(IMediaService mediaService) : ControllerBase
{
    /// <summary>
    /// Retrieves a paginated list of media (Files, Images, Videos, Audio) within a specific conversation.
    /// </summary>
    /// <remarks>
    /// **Frontend Guide:**
    /// - Pass the `type` parameter in the URL query to filter the specific media type.
    /// - Supported types: `image`, `video`, `audio`, `document`, `file`.
    /// - Example: `GET /api/media/conversation/conv_123?type=image&amp;page=1&amp;pageSize=20`
    /// </remarks>
    /// <param name="conversationId">The unique identifier of the conversation.</param>
    /// <param name="request">Pagination and filtering parameters (Page, PageSize, Type).</param>
    /// <param name="token">Cancellation token.</param>
    /// <response code="200">Successfully retrieved the list of media.</response>
    /// <response code="401">Unauthorized access or invalid token.</response>
    [HttpGet("conversation/{conversationId}")]
    public async Task<IActionResult> GetConversationMedia(
        string conversationId,
        [FromQuery] GetMediaRequestDto request,
        CancellationToken token)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized("Invalid token or user not logged in.");

        var result = await mediaService.GetConversationMediaAsync(conversationId, userId, request, token);
        return result.Match(Ok, MapErrorToProblem);
    }

    /// <summary>
    /// Uploads a media file (Image, Video, Audio, Document) to a specific conversation.
    /// </summary>
    /// <remarks>
    /// **CRITICAL FOR FRONTEND (HYBRID FLOW):**
    /// 1. Send the file using `multipart/form-data` with the key `file`.
    /// 2. This API will return a response containing the `messageId` and `isPending = true`. Use the returned `fileUrl` to instantly render the media on the UI for an optimistic user experience.
    /// 3. **MANDATORY:** Once rendered, you MUST invoke the SignalR Hub method `CompletePendingMessage(messageId)` to confirm the status with the Backend. Only after this confirmation will the message be broadcasted to the rest of the group!
    /// </remarks>
    /// <param name="conversationId">The unique identifier of the target conversation.</param>
    /// <param name="file">The physical file to be uploaded (sent via form-data).</param>
    /// <param name="token">Cancellation token.</param>
    /// <response code="200">File uploaded successfully. Returns the cloud URL and pending messageId.</response>
    /// <response code="400">The file is missing, exceeds the size limit, or has an unsupported extension.</response>
    /// <response code="401">Unauthorized access or the user is not a member of this conversation.</response>
    [HttpPost("conversation/{conversationId}/upload")]
    [RequestSizeLimit(100_000_000)] // Limit to ~100MB at Controller level (Detailed validation handled by FluentValidation)
    [ProducesResponseType(typeof(UploadMediaResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadMedia(
        string conversationId,
        IFormFile? file,
        CancellationToken token)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized("Invalid token or user not logged in.");
        if (file == null || file.Length == 0) 
        {
            return BadRequest("No file uploaded or file is empty.");
        }

        await using var stream = file.OpenReadStream();
        var result = await mediaService.UploadMediaAsync(
            conversationId,
            userId,
            stream,
            file.FileName,
            file.Length,
            token);

        return result.Match(Ok, MapErrorToProblem);
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
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            _ => StatusCodes.Status500InternalServerError
        };

        return Problem(statusCode: statusCode, detail: firstError.Description);
    }
}
