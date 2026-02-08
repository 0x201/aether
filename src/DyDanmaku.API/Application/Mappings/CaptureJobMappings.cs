namespace DyDanmaku.API.Application.Mappings;

public class CaptureJobMapping
{
    public static CaptureJobDto MapToDto((CaptureJob job, Room room) captureJobWithRoom)
    {
        var (job, room) = captureJobWithRoom;
        return new CaptureJobDto(
             job.Id,
             job.RoomId,
             job.Duration,
             job.Status,
             job.StartTime.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss.fff"),
             job.EndTime?.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss.fff"),
             job.CreatedAt.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss.fff"),
             room.RoomName
        );
    }

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

    public static List<CaptureJobDto> MapToDtos(List<(CaptureJob job, Room room)> captureJobsWithRooms)
    {
        return [.. captureJobsWithRooms.Select(MapToDto)];
    }

    public static List<CaptureJobDto> MapToDtos(List<CaptureJob> captureJobs)
    {
        return [.. captureJobs.Select(MapToDto)];
    }
}