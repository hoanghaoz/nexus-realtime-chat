using System.ComponentModel.DataAnnotations;

namespace NexusChat.Application.DTOs.Rooms;

public class CreateGroupRequestDto
{
    [Required(ErrorMessage = "Tên nhóm không được để trống")]
    public string Name { get; set; } = string.Empty;

    public List<string> ParticipantIds { get; set; } = new();
}