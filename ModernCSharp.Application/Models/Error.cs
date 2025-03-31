namespace ModernCSharp.Application.Models;

public sealed record Error(string Code, string Description)
{
    public static readonly Error None = new(string.Empty, string.Empty);

    public override string ToString()
    {
        return $"Error code: {Code}. Error details: {Description}";
    }
}