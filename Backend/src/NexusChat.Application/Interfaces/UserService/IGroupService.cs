using ErrorOr;
using NexusChat.Application.DTOs.Room;
using NexusChat.Application.DTOs.Rooms;

namespace NexusChat.Application.Interfaces.UserService;

public interface IGroupService
{
    Task<ErrorOr<GroupResponseDto>> CreateGroupAsync(string creatorId, CreateGroupRequestDto dto, CancellationToken token);
}