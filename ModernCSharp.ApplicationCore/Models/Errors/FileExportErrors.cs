namespace ModernCSharp.ApplicationCore.Models.Errors;

public static class FileExportErrors
{
    public static readonly Error InvalidContext = new("", "Invalid context");
    public static readonly Error InvalidOutputPath = new("", "Invalid output path");
}
