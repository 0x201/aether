namespace DyDanmaku.API.Application.Models;

public record CaptureJobDto(
    int Id,
    int RoomId,
    int Duration,
    string Status,
    string StartTime,
    string? EndTime,
    string CreatedAt
);