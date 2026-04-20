using ErrorOr;
using FluentValidation;
using NexusChat.Application.DTOs.Room;
using NexusChat.Application.DTOs.Rooms;
using NexusChat.Application.Interfaces.ConversationRepository;
using NexusChat.Application.Interfaces.Hubs;
using NexusChat.Application.Interfaces.UserService;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Entity.EmbeddedObject;
using NexusChat.Domain.Enum;
using System.Net.WebSockets;

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
    public async Task<ErrorOr<GroupResponseDto>> AddMemberAsync(string userId, string groupId, AddMemberRequestDto dto, CancellationToken token)
    {
        var group = await conversationRepo.GetByIdAsync(groupId, token);
        if (group is null || group.RoomType != RoomType.Group)
        {
            return Error.NotFound("Group.NotFound", "Không tìm thấy nhóm này.");
        }
        if (dto.ParticipantIds.Any())
        {
            bool isMember = group.Participants.Any(p => p.UserId == userId);
            if (!isMember)
            {
                return Error.Validation("Group.Unauthorized", "Bạn không phải là thành viên của nhóm này.");
            }
        }
        var existingUserIds = group.Participants.Select(p => p.UserId).ToList();
        var newGuestIds = dto.ParticipantIds.Distinct().Where(id => !existingUserIds.Contains(id)).ToList();
        if (!newGuestIds.Any())
        {
            return Error.Validation("Group.NoNewMembers", "Tất cả những người này đều đã ở trong nhóm.");
        }
        foreach (var tempId in newGuestIds)
        {
            group.Participants.Add(new Participant
            {
                UserId = tempId,
                Role = ParticipantRole.Member,
                JoinedAt = DateTime.UtcNow
            });
        }
        await conversationRepo.UpdateAsync(group, token);
        var response = new GroupResponseDto
        {
            Id = group.Id,
            Name = group.Name,
            RoomType = group.RoomType,
            CreatedBy = group.CreatedBy,
            CreatedAt = group.CreatedAt
        };
        await notify.NotifyAddedToGroupAsync(newGuestIds, response, token);
        return response;
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
    public async Task<ErrorOr<bool>> RemoveMemberAsync(string actionUserId, string groupId, string targetUserId, CancellationToken token)
    {
        var group = await conversationRepo.GetByIdAsync(groupId, token);
        if (group is null || group.RoomType != RoomType.Group)
        {
            return Error.NotFound("Group.NotFound", "Không tìm thấy nhóm này.");
        }

        if (group.CreatedBy != actionUserId)
        {
            return Error.Validation("Group.Unauthorized", "Chỉ trưởng nhóm mới được quyền xóa người khác.");
        }

        if (actionUserId == targetUserId)
        {
            return Error.Validation("Group.InvalidAction", "Trưởng nhóm không thể tự xóa chính mình.");
        }

        var targetParticipant = group.Participants.FirstOrDefault(p => p.UserId == targetUserId);
        if (targetParticipant == null)
        {
            return Error.NotFound("Group.MemberNotFound", "Người này không có mặt trong nhóm.");
        }

        group.Participants.Remove(targetParticipant);

        await conversationRepo.UpdateAsync(group, token);

        return true;
    }

}