using System.Net;

namespace ModernCSharp.Shared.Models;

public record Result
{
    public HttpStatusCode Status { get; set; }
    public string Message { get; set; } = "Request Successfully";

    public static Result Success(string message)
    {
        return new Result
        {
            Status = HttpStatusCode.OK,
            Message = message,
        };
    }

    public static Result Failure(HttpStatusCode status, string message)
    {
        return new Result
        {
            Status = status,
            Message = message,
        };
    }
}


public record Result<T> : Result
 where T : class
{
    public required T? Data { get; set; }

    public static Result<T> Success(T data, string? message = null)
    {
        return new Result<T>
        {
            Status = HttpStatusCode.OK,
            Message = message ?? "Request Successfully",
            Data = data
        };
    }

    public static Result<T> Failure(HttpStatusCode status, string message, T? data)
    {
        return new Result<T>
        {
            Status = status,
            Message = message,
            Data = data,
        };
    }
}