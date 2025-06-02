namespace ModernCSharp.Ordering.Domain.Constants;

public static class JsonSerializationConstants
{
    public static readonly JsonSerializerOptions DefaultOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };
}
