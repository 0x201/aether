namespace ModernCSharp.ApplicationCore.Models.Errors;

public static class FileImportErrors
{
    public static readonly Error InvalidContext = new("", "Invalid context");
    public static readonly Error InvalidInputPath = new("", "Invalid input path");
}
