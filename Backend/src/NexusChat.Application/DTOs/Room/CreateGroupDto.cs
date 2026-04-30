namespace NexusChat.Application.DTOs.Room;

public class CreateGroupRequestDto
{
    public required string Name { get; set; }
    public List<string> ParticipantIds { get; set; } = [];
}