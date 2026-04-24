namespace DyDanmaku.API.Application.Interfaces;

public interface ICaptureTaskStore
{
    Task SaveAsync(int roomId, CaptureTaskMetadata metadata, CancellationToken cancellationToken = default);
    Task RemoveAsync(int roomId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CaptureTaskMetadata>> GetAllAsync(CancellationToken cancellationToken = default);
}
