using ErrorOr;
using NexusChat.Application.DTOs.Users;
using NexusChat.Application.Interfaces;
using NexusChat.Application.Interfaces.UserRepository;
using NexusChat.Domain.Entity;

namespace NexusChat.Application.Services.UserUpdateService.cs;

public class UserUpdateService(IUserRepository userRepository) : IUserUpdateService
{
    public async Task<ErrorOr<string>> UpdateUserAsync(string userId, UserUpdateDto dto, CancellationToken token)
    {
        var user = await userRepository.GetByIdAsync(userId, token);
        if (user == null)
        {
            return Error.NotFound("User.NotFound", "User not found");
        }

        if (!string.IsNullOrWhiteSpace(dto.Username) && dto.Username != user.UserName)
        {
            user.UserName = dto.Username;
        }

        if (user.UpdatedAt.HasValue)
        {
            var daysElapsed = (DateTime.UtcNow - user.UpdatedAt.Value).TotalDays;
            if (daysElapsed < 14)
            {
                var daysRemaining = Math.Ceiling(14 - daysElapsed);
                return Error.Validation("User.UpdateCooldown",
                    $"You can only update your profile every 14 days. Please try again after {daysRemaining} day(s)");
            }
        }

        user.UpdatedAt = DateTime.UtcNow;
        await userRepository.UpdateAsync(user, token);
        return "User profile updated successfully";
    }
}