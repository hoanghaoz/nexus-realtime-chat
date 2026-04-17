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
}