<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Read;

use HaakCo\Custd\Fields;

final readonly class AnalyticsDashboardEvents
{
    public function __construct(
        public int $total,
        public int $loadedDayCount,
        public ?string $oldestEventAt = null,
        public ?string $latestEventAt = null,
        public ?string $latestReceivedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'total'),
            Fields::integer($payload, 'loadedDayCount'),
            Fields::optionalString($payload, 'oldestEventAt'),
            Fields::optionalString($payload, 'latestEventAt'),
            Fields::optionalString($payload, 'latestReceivedAt'),
        );
    }
}
