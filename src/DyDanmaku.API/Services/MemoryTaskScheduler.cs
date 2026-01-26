namespace DyDanmaku.API.Services;

public class MemoryTaskScheduler(ILogger<MemoryTaskScheduler> logger) : IMemoryTaskScheduler, IDisposable
{
    private readonly ConcurrentDictionary<string, Task> _runningTasks = [];
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _cancellationTokenSources = [];

    public async Task<bool> AddTaskAsync(string taskId, Func<CancellationToken, Task> taskFunc, CancellationToken cancellationToken = default)
    {
        if (_runningTasks.ContainsKey(taskId))
        {
            logger.LogWarning("Task with ID [{TaskId}] already exists", taskId);
            return false;
        }

        var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        if (!_cancellationTokenSources.TryAdd(taskId, cts))
        {
            logger.LogError("Failed to add cancellation token source for task [{TaskId}]", taskId);
            return false;
        }

        var task = Task.Run(async () =>
        {
            try
            {
                await taskFunc(cts.Token);
            }
            catch (OperationCanceledException)
            {
                logger.LogInformation("Task [{TaskId}] was cancelled", taskId);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred in task [{TaskId}]", taskId);
            }
            finally
            {
                CleanupTask(taskId);
            }
        }, cts.Token);

        if (!_runningTasks.TryAdd(taskId, task))
        {
            cts.Cancel();
            CleanupTask(taskId);
            return false;
        }

        logger.LogInformation("Task [{TaskId}] started successfully", taskId);
        return true;
    }

    public async Task<bool> RemoveTaskAsync(string taskId)
    {
        if (!_runningTasks.ContainsKey(taskId))
        {
            logger.LogWarning("Task [{TaskId}] does not exist", taskId);
            return false;
        }

        await CancelTaskAsync(taskId);

        if (_runningTasks.TryGetValue(taskId, out var task))
        {
            try
            {
                await Task.WhenAny(task, Task.Delay(5000));
            }
            catch
            {
            }
        }

        CleanupTask(taskId);
        logger.LogInformation("Task [{TaskId}] removed successfully", taskId);
        return true;
    }

    public IEnumerable<string> GetActiveTaskIds()
    {
        return [.. _runningTasks.Keys];
    }

    public async Task<bool> CancelTaskAsync(string taskId)
    {
        if (_cancellationTokenSources.TryGetValue(taskId, out var cts))
        {
            cts.Cancel();
            logger.LogInformation("Cancellation requested for task [{TaskId}]", taskId);
            return true;
        }

        logger.LogWarning("No cancellation token found for task [{TaskId}]", taskId);
        return false;
    }

    public async Task CancelAllTasksAsync()
    {
        var taskIds = _cancellationTokenSources.Keys.ToList();
        foreach (var taskId in taskIds)
        {
            await CancelTaskAsync(taskId);
        }

        var tasks = _runningTasks.Values.ToList();
        if (tasks.Count != 0)
        {
            try
            {
                await Task.WhenAll(tasks.Select(t => Task.WhenAny(t, Task.Delay(5000))));
            }
            catch
            {
            }
        }

        foreach (var taskId in taskIds)
        {
            CleanupTask(taskId);
        }

        logger.LogInformation("All tasks cancelled");
    }

    private void CleanupTask(string taskId)
    {
        _ = _runningTasks.TryRemove(taskId, out _);

        if (_cancellationTokenSources.TryRemove(taskId, out var cts))
        {
            cts?.Dispose();
        }
    }

    public void Dispose()
    {
        CancelAllTasksAsync().Wait(TimeSpan.FromSeconds(5));
    }
}