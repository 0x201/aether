namespace ModernCSharp.ApplicationCore.Common.Models;

public class Result
{
    protected Result(bool succeeded, IEnumerable<string> errors)
    {
        Succeeded = succeeded;
        Error = [.. errors];
    }

    public bool Succeeded
    {
        get;
        init;
    }

    public string[] Error
    {
        get;
        init;
    }

    public static Result Success() => new(true, []);

    public static Result Failure(IEnumerable<string> errors) => new(false, errors);

}

public class ImportResult<T>(bool succeeded, IEnumerable<string> errors, List<T> data) : Result(succeeded, errors)
{
    public List<T> Data { get; } = data ?? [];

    public static ImportResult<T> Success(List<T> data) => new(true, [], data);

    public static new ImportResult<T> Failure(IEnumerable<string> errors) => new(false, errors, []);
}
