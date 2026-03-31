using ErrorOr;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NexusChat.Application.DTOs.Users;
using NexusChat.Application.Interfaces;

namespace NexusChat.Api.Controllers;

[Route ("api/users")]
[ApiController]
public class UserController(IUserUpdateService userUpdateService) : ControllerBase 
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
    public async Task<IActionResult> Update(string userId, [FromBody] UserUpdateDto updateDto, CancellationToken token)
    {
        var result = await userUpdateService.UpdateUserAsync(userId, updateDto, token);

        return result.Match(
            successMesage => Ok(new { message = successMesage }),
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
        return  Problem(statusCode: statusCode, detail: firstError.Description);
    }
}