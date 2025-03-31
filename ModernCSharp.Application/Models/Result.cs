namespace ModernCSharp.Application.Models;

public interface IResult
{
    public bool IsSuccess
    {
        get;
    }
    public bool IsFailure => !IsSuccess;
    public Error Error
    {
        get;
    }
}

public class Result : IResult
{
    protected Result(bool isSuccess, Error error)
    {
        if (isSuccess && error != Error.None ||
            !isSuccess && error == Error.None)
        {
            throw new ArgumentException("Invalid error", nameof(error));
        }

        IsSuccess = isSuccess;
        Error = error;
    }

    public bool IsSuccess
    {
        get;
    }
    public bool IsFailure => !IsSuccess;
    public Error Error
    {
        get;
    }
    public static Result Success() => new(true, Error.None);
    public static Result Failure(Error error) => new(false, error);

    protected static TResult CreateSuccess<TResult>(Func<bool, Error, TResult> creator)
        where TResult : Result
    {
        return creator(true, Error.None);
    }

    protected static TResult CreateFailure<TResult>(Error error, Func<bool, Error, TResult> creator)
       where TResult : Result
    {
        return creator(false, error);
    }
}

public class ImportResult<T>(bool isSuccess, Error error, List<T> data) : Result(isSuccess, error)
{
    public List<T> Data { get; } = data ?? [];

    public static ImportResult<T> Success(List<T> data)
        => CreateSuccess((isSuccess, error) => new ImportResult<T>(isSuccess, error, data));

    public static new ImportResult<T> Failure(Error error)
        => CreateFailure(error, (isSuccess, err) => new ImportResult<T>(isSuccess, err, null));
}
