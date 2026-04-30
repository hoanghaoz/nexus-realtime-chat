using System.Text.RegularExpressions;

namespace NexusChat.Application.Extension;

public static partial class LinkPreviewRegex
{
    public static string? GetFirstLink(this string? message)
    {
        if (string.IsNullOrEmpty(message)) return null;

        var match = MyRegex().Match(message);
        return match.Success ? match.Value.TrimEnd('.', ',', '!', '?', ';') : null;
    }

    [GeneratedRegex(@"(https?://[^\s]+)", RegexOptions.IgnoreCase, 
        5000)]
    private static partial Regex MyRegex();
}