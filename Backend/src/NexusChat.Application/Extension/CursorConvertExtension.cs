using System.Globalization;
using System.Text;
using NexusChat.Application.DTOs.Message;

namespace NexusChat.Application.Extension;

public static class CursorConvertExtension
{
    public static string? ConvertToBase64(this string? cursor)
    {
        if (string.IsNullOrEmpty(cursor))
            return null;

        var cursorBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(cursor));
        return cursorBase64;
    }

    public static Cursor? ConvertToCursor(this string? cursor)
    {
        if (string.IsNullOrEmpty(cursor))
            return null;
        try
        {
            var decode = Convert.FromBase64String(cursor);
            var decodeString = Encoding.UTF8.GetString(decode);
            var parts = decodeString.Split('_');
            if (parts.Length == 2 &&
                DateTime.TryParse(parts[0], null, DateTimeStyles.RoundtripKind, out var dateTime))
                return new Cursor(parts[1], dateTime);
        }
        catch (FormatException)
        {
        }

        return null;
    }
}