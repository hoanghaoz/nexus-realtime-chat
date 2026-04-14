using ErrorOr;
using NexusChat.Application.DTOs.Rooms;
using NexusChat.Domain.Entity;

namespace NexusChat.Application.Interfaces;

public interface IRoomService
{
    Task<ErrorOr<GroupResponseDto>> CreateGroupAsync(string creatorId, CreateGroupRequestDto dto, CancellationToken token);
}