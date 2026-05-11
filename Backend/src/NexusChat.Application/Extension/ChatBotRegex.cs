using System.Text.RegularExpressions;
using System.Xml.Xsl;

namespace NexusChat.Application.Extension;

public static partial class ChatBotRegex
{
    public const string MissionSummarize = "Summarize";
    public const string MissionRemind = "Remind";
    public static string? DetectBotMission(this string? message)
    {
        if (string.IsNullOrEmpty(message)) return null;
        
        return MyRegex().IsMatch(message) ? MissionSummarize : null;
    }
    
    [GeneratedRegex(@"(tóm tắt|tổng hợp|review lại|chốt lại|có chuyện gì)", 
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,5000)]
    private static partial Regex MyRegex();
}