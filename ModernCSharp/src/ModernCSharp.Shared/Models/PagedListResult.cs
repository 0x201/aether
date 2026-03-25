using System.Net;

namespace ModernCSharp.Shared.Models;

public record PagedListResult<T> : Result
{
    public IReadOnlyList<T> Data { get; set; } = [];
    public int Total { get; set; } = 0;

    private PagedListResult()
    {

    }

    public static PagedListResult<T> Success(IReadOnlyList<T> data, int total)
    {
        return new PagedListResult<T>
        {
            Status = HttpStatusCode.OK,
            Data = data,
            Total = total
        };
    }
}
