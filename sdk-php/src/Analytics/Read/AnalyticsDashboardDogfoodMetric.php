<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Read;

use HaakCo\Custd\Fields;

final readonly class AnalyticsDashboardDogfoodMetric
{
    public function __construct(
        public string $sourceSystem,
        public string $service,
        public string $metricName,
        public string $metricKind,
        public float $value,
        public string $unit,
        public ?string $windowStart = null,
        public ?string $windowEnd = null,
        public ?string $route = null,
        public ?string $status = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'sourceSystem'),
            Fields::string($payload, 'service'),
            Fields::string($payload, 'metricName'),
            Fields::string($payload, 'metricKind'),
            Fields::number($payload, 'value'),
            Fields::string($payload, 'unit'),
            Fields::optionalString($payload, 'windowStart'),
            Fields::optionalString($payload, 'windowEnd'),
            Fields::optionalString($payload, 'route'),
            Fields::optionalString($payload, 'status'),
        );
    }
}
