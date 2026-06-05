using System.Text.RegularExpressions;

namespace NexusChat.Application.Extension;

// TODO: implement llm layer to detect bot mission when regex collision
public static partial class ChatBotRegex
{
    public const string MissionSummarize = "Summarize";
    public const string MissionRemind = "Remind";
    public const string MissionNone = "None";

    public static string? DetectBotMission(this string? message)
    {
        if (string.IsNullOrEmpty(message)) return null;

        if (SummaryRegex().IsMatch(message)) return MissionSummarize;
        return RemindRegex().IsMatch(message) ? MissionRemind : MissionNone;
    }

    [GeneratedRegex(@"(tóm tắt|tổng hợp|review lại|chốt lại|có chuyện gì|summarize|review)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant, 5000)]
    private static partial Regex SummaryRegex();

    [GeneratedRegex(@"(nhắc|báo|gọi|remind|ping)\s+(tao|mình|anh em|mọi người|@\w+)\s+(lúc|vào|sau|chiều nay|mai)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant, 5000)]
    private static partial Regex RemindRegex();
}