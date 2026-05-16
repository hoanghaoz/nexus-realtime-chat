using System.Text.Json.Serialization;

namespace NexusChat.Application.DTOs.ChatBot;

public sealed record RemindExtractionDto
{
    [JsonPropertyName("task")] public string Task { get; set; } = string.Empty;

    [JsonPropertyName("executeAt")] public DateTime? ExecuteAt { get; set; }
}