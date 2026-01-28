namespace DyDanmaku.API.Application.Mappings;

public class CaptureJobMapping
{
    public static CaptureJobDto MapToDto(CaptureJob captureJob)
    {
        return new CaptureJobDto(
             captureJob.Id,
             captureJob.RoomId,
             captureJob.Duration,
             captureJob.Status,
             captureJob.StartTime.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss.fff"),
             captureJob.EndTime?.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss.fff"),
             captureJob.CreatedAt.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss.fff")
        );
    }

    public static List<CaptureJobDto> MapToDtos(List<CaptureJob> captureJobs)
    {
        return [.. captureJobs.Select(MapToDto)];
    }
}