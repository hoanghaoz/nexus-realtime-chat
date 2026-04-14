using ErrorOr;
using NexusChat.Application.DTOs.Rooms;

namespace NexusChat.Application.Interfaces.RoomService;

public interface IGroupService
{
    Task<ErrorOr<GroupResponseDto>> CreateGroupAsync(string creatorId, CreateGroupRequestDto dto, CancellationToken token);
}