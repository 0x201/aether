using System.Text.Json;

namespace ModernCSharp.ApplicationCore.Constants;

public static class JsonSerializationConstants
{
    public static readonly JsonSerializerOptions DefaultOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };
}
