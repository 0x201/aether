namespace Aether.Shared.Utils;

public static class SortingHelper
{
    public static string ProcessSortExpression(string sortExpression, Dictionary<string, string> fieldMappings)
    {
        if (string.IsNullOrEmpty(sortExpression)) return sortExpression;

        var parts = sortExpression.Split(',');

        var processedParts = new List<string>();
        string currentDirection = "asc";

        foreach (var part in parts)
        {
            var trimmedPart = part.Trim();

            if (trimmedPart.EndsWith(" asc", StringComparison.OrdinalIgnoreCase))
            {
                currentDirection = "asc";
                var fieldPart = trimmedPart[..^4].Trim();
                ProcessField(fieldPart, currentDirection, processedParts, fieldMappings);
            }
            else if (trimmedPart.EndsWith(" desc", StringComparison.OrdinalIgnoreCase))
            {
                currentDirection = "desc";
                var fieldPart = trimmedPart[..^5].Trim();
                ProcessField(fieldPart, currentDirection, processedParts, fieldMappings);
            }
            else
            {
                ProcessField(trimmedPart, currentDirection, processedParts, fieldMappings);
            }
        }

        return string.Join(", ", processedParts);
    }

    private static void ProcessField(string fieldPart, string direction, List<string> processedParts, Dictionary<string, string> fieldMappings)
    {
        if (string.IsNullOrWhiteSpace(fieldPart)) return;

        var fields = fieldPart.Split([','], StringSplitOptions.RemoveEmptyEntries);

        foreach (var field in fields)
        {
            var trimmedField = field.Trim();
            if (string.IsNullOrEmpty(trimmedField)) continue;

            if (fieldMappings.TryGetValue(trimmedField.ToLower(), out var mappedField))
            {
                processedParts.Add($"{mappedField} {direction}");
            }
        }
    }
}