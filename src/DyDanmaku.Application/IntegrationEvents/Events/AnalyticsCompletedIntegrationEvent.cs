
using ModernCSharp.EventBus.Events;

namespace DyDanmaku.Application.IntegrationEvents.Events;

public record AnalyticsCompletedIntegrationEvent(
    int RoomId,
    DateTime StartDate,
    DateTime EndDate,
    string PeriodType,
    int FrequenciesCount,
    DateTime CompletedAt
) : IntegrationEvent;
