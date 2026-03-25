namespace DyDanmaku.API.Application.Services;

public class MemoryTaskScheduler(ILogger<MemoryTaskScheduler> logger) : IMemoryTaskScheduler, IDisposable
{
    private readonly ConcurrentDictionary<string, Task> _runningTasks = [];
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _cancellationTokenSources = [];

    public async Task<bool> AddTaskAsync(string taskId, Func<CancellationToken, Task> taskFunc, CancellationToken cancellationToken = default)
    {
        if (_runningTasks.ContainsKey(taskId))
        {
            logger.ZLogWarning($"Task with ID [{taskId}] already exists");
            return false;
        }

        var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        if (!_cancellationTokenSources.TryAdd(taskId, cts))
        {
            logger.ZLogError($"Failed to add cancellation token source for task [{taskId}]");
            return false;
        }

        var task = Task.Factory.StartNew(async () =>
        {
            try
            {
                await taskFunc(cts.Token);
            }
            catch (OperationCanceledException)
            {
                logger.ZLogInformation($"Task [{taskId}] was cancelled");
            }
            catch (Exception ex)
            {
                logger.ZLogError($"An error occurred in task [{taskId}]. Exception: {ex}");
            }
            finally
            {
                CleanupTask(taskId);
            }
        }, cts.Token, TaskCreationOptions.LongRunning, TaskScheduler.Default);

        if (!_runningTasks.TryAdd(taskId, task))
        {
            cts.Cancel();
            CleanupTask(taskId);
            return false;
        }

        logger.ZLogInformation($"Task [{taskId}] started successfully");
        return true;
    }

    public async Task<bool> RemoveTaskAsync(string taskId)
    {
        if (!_runningTasks.ContainsKey(taskId))
        {
            logger.ZLogWarning($"Task [{taskId}] does not exist in the running tasks");
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
        logger.ZLogInformation($"Task [{taskId}] removed successfully");
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
            logger.ZLogInformation($"Cancellation requested for task [{taskId}]");
            return true;
        }

        logger.ZLogWarning($"No cancellation token found for task [{taskId}]");
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

        logger.ZLogInformation($"All tasks cancelled successfully");
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