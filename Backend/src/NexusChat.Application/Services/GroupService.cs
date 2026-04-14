using ErrorOr;
using NexusChat.Application.DTOs.Rooms;
using NexusChat.Application.Interfaces.Common;
using NexusChat.Application.Interfaces.RoomService;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Entity.EmbeddedObject;
using NexusChat.Domain.Enum;

namespace NexusChat.Application.Services;

public class GroupService(IConversationRepository conversationRepo) : IGroupService
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
            Name = dto.Name,
            RoomType = RoomType.Group,
            CreatedBy = creatorId,
            Participants = participants,
            CreatedAt = DateTime.UtcNow
        };

        await conversationRepo.AddAsync(newGroup, token);
        return new GroupResponseDto
        {
            Id = newGroup.Id,
            Name = newGroup.Name,
            RoomType = newGroup.RoomType,
            CreatedBy = newGroup.CreatedBy,
            CreatedAt = newGroup.CreatedAt
        };
    }
}