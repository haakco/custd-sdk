<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Read;

use HaakCo\Custd\Fields;

final readonly class AnalyticsDashboardDogfoodSource
{
    public function __construct(
        public string $sourceSystem,
        public string $sourceCompany,
        public string $environment,
        public int $eventCount,
        public string $latestEventType,
        public int $failureCount,
        public int $rejectionCount,
        public string $status,
        public ?string $latestEventAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'sourceSystem'),
            Fields::string($payload, 'sourceCompany'),
            Fields::string($payload, 'environment'),
            Fields::integer($payload, 'eventCount'),
            Fields::string($payload, 'latestEventType'),
            Fields::integer($payload, 'failureCount'),
            Fields::integer($payload, 'rejectionCount'),
            Fields::string($payload, 'status'),
            Fields::optionalString($payload, 'latestEventAt'),
        );
    }
}
