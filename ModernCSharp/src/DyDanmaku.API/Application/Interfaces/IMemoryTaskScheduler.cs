namespace DyDanmaku.API.Application.Interfaces;

public interface IMemoryTaskScheduler
{
    Task<bool> AddTaskAsync(string taskId, Func<CancellationToken, Task> taskFunc, CancellationToken cancellationToken = default);
    Task<bool> RemoveTaskAsync(string taskId);
    IEnumerable<string> GetActiveTaskIds();
    Task<bool> CancelTaskAsync(string taskId);
    Task CancelAllTasksAsync();
}