<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics;

use HaakCo\Custd\Admin\ApiHttp;
use HaakCo\Custd\Analytics\Read\AnalyticsActiveNow;
use HaakCo\Custd\Analytics\Read\AnalyticsDashboardSummary;
use HaakCo\Custd\Analytics\Read\AnalyticsTelemetryEventCount;

/**
 * ReadClient reads the tenant's event overview beside the event query: the realtime active-visitor count, the
 * stored-event summary and the per-day event count.
 */
final class ReadClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Count the sessions active on one site now; a 503 means realtime counts are unavailable.
     */
    public function activeNow(string $site): AnalyticsActiveNow
    {
        return AnalyticsActiveNow::fromPayload($this->http->object('GET', '/api/v1/analytics/active-now', ['site' => $site], null));
    }

    /**
     * Read the tenant's stored-event overview.
     */
    public function dashboardSummary(): AnalyticsDashboardSummary
    {
        return AnalyticsDashboardSummary::fromPayload($this->http->object('GET', '/api/v1/analytics/dashboard-summary', [], null));
    }

    /**
     * Count the tenant's events on one UTC date (YYYY-MM-DD), optionally of one event type.
     */
    public function telemetryEventCount(string $date, ?string $eventType = null): AnalyticsTelemetryEventCount
    {
        return AnalyticsTelemetryEventCount::fromPayload($this->http->object('GET', '/api/v1/telemetry/event-count', ['date' => $date, 'eventType' => $eventType], null));
    }
}
