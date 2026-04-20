using ErrorOr;
using NexusChat.Application.DTOs.Room;
using NexusChat.Application.DTOs.Rooms;
using NexusChat.Application.Interfaces.ConversationRepository;
using NexusChat.Application.Interfaces.Hubs;
using NexusChat.Application.Interfaces.UserService;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Entity.EmbeddedObject;
using NexusChat.Domain.Enum;

namespace NexusChat.Application.Services;

public class GroupService(IConversationRepository conversationRepo, IRealtimeNotification notify) : IGroupService
{
    public async Task<ErrorOr<GroupResponseDto>> CreateGroupAsync(string creatorId, CreateGroupRequestDto dto, CancellationToken token)
    {
        var participants = new List<Participant>
        {
            new Participant { UserId = creatorId, Role = ParticipantRole.Owner, JoinedAt = DateTime.UtcNow }
        };

        if (dto.ParticipantIds.Any())
        {
            var guestIds = dto.ParticipantIds.Distinct().Where(id => id != creatorId);
            participants.AddRange(guestIds.Select(userId => new Participant
            {
                UserId = userId,
                Role = ParticipantRole.Member,
                JoinedAt = DateTime.UtcNow
            }));
        }

        var newGroup = new Conversation
        {
            Id = Guid.NewGuid().ToString(),
            Name = dto.Name,
            RoomType = RoomType.Group,
            CreatedBy = creatorId,
            Participants = participants,
            CreatedAt = DateTime.UtcNow
        };

        await conversationRepo.AddAsync(newGroup, token);

        var response = new GroupResponseDto
        {
            Id = newGroup.Id,
            Name = newGroup.Name,
            RoomType = newGroup.RoomType,
            CreatedBy = newGroup.CreatedBy,
            CreatedAt = newGroup.CreatedAt
        };

        var allUserIdsToNotify = new List<string>(dto.ParticipantIds) { creatorId };
        await notify.NotifyAddedToGroupAsync(allUserIdsToNotify, response, token);

        return response;
    }
    public async Task<ErrorOr<GroupResponseDto>> UpdateGroupAsync(string userId, string groupId, UpdateGroupRequestDto dto, CancellationToken token)
    {
        var group = await conversationRepo.GetByIdAsync(groupId, token);

        if (group is null || group.RoomType != RoomType.Group)
        {
            return Error.NotFound("Group.NotFound", "Không tìm thấy nhóm này.");
        }

        if (group.CreatedBy != userId)
        {
            return Error.Validation("Group.Unauthorized", "Bạn không có quyền sửa thông tin nhóm này.");
        }

        group.Name = dto.Name;
        await conversationRepo.UpdateAsync(group, token);

        return new GroupResponseDto
        {
            Id = group.Id,
            Name = group.Name,
            RoomType = group.RoomType,
            CreatedBy = group.CreatedBy,
            CreatedAt = group.CreatedAt
        };
    }

    public async Task<ErrorOr<bool>> DeleteGroupAsync(string userId, string groupId, CancellationToken token)
    {
        var group = await conversationRepo.GetByIdAsync(groupId, token);

        if (group is null || group.RoomType != RoomType.Group)
        {
            return Error.NotFound("Group.NotFound", "Không tìm thấy nhóm này.");
        }

        if (group.CreatedBy != userId)
        {
            return Error.Validation("Group.Unauthorized", "Chỉ trưởng nhóm mới được phép giải tán nhóm.");
        }

        await conversationRepo.DeleteAsync(group, token);

        return true;
    }
}