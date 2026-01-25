
using ModernCSharp.EventBus.Events;

namespace DyDanmaku.Application.IntegrationEvents.Events;

public record AnalyticsCompletedIntegrationEvent(
    int? roomId,
    string startDate,
    string endDate,
    string periodType,
    int frequenciesCount,
    string completedAt
) : IntegrationEvent;
