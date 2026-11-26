<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Read;

use HaakCo\Custd\Fields;

final readonly class AnalyticsDashboardDogfood
{
    /**
     * @param list<AnalyticsDashboardDogfoodSource> $sources
     * @param list<AnalyticsDashboardDogfoodMetric> $metrics
     */
    public function __construct(
        public array $sources,
        public array $metrics,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(AnalyticsDashboardDogfoodSource::fromPayload(...), Fields::objects($payload, 'sources')),
            array_map(AnalyticsDashboardDogfoodMetric::fromPayload(...), Fields::objects($payload, 'metrics')),
        );
    }
}
