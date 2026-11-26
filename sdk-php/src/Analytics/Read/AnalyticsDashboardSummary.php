<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Read;

use HaakCo\Custd\Fields;

/**
 * AnalyticsDashboardSummary is the tenant's stored-event overview: totals, day coverage and the dogfood sources.
 */
final readonly class AnalyticsDashboardSummary
{
    /**
     * @param list<AnalyticsDashboardLoadedDay> $loadedDays
     */
    public function __construct(
        public AnalyticsDashboardTenant $tenant,
        public AnalyticsDashboardEvents $events,
        public AnalyticsDashboardCoverage $coverage,
        public array $loadedDays,
        public AnalyticsDashboardDogfood $dogfood,
        public string $generatedAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            AnalyticsDashboardTenant::fromPayload(Fields::object($payload, 'tenant')),
            AnalyticsDashboardEvents::fromPayload(Fields::object($payload, 'events')),
            AnalyticsDashboardCoverage::fromPayload(Fields::object($payload, 'coverage')),
            array_map(AnalyticsDashboardLoadedDay::fromPayload(...), Fields::objects($payload, 'loadedDays')),
            AnalyticsDashboardDogfood::fromPayload(Fields::object($payload, 'dogfood')),
            Fields::string($payload, 'generatedAt'),
        );
    }
}
