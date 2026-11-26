<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Read;

use HaakCo\Custd\Fields;

final readonly class AnalyticsDashboardLoadedDay
{
    public function __construct(
        public string $date,
        public int $eventCount,
        public string $archiveStatus,
        public string $queryHref,
        public ?string $archiveVerifiedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'date'),
            Fields::integer($payload, 'eventCount'),
            Fields::string($payload, 'archiveStatus'),
            Fields::string($payload, 'queryHref'),
            Fields::optionalString($payload, 'archiveVerifiedAt'),
        );
    }
}
