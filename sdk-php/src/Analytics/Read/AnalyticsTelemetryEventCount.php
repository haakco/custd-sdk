<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Read;

use HaakCo\Custd\Fields;

/**
 * AnalyticsTelemetryEventCount is how many of the tenant's events landed on one UTC date.
 */
final readonly class AnalyticsTelemetryEventCount
{
    public function __construct(
        public int $count,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'count'),
        );
    }
}
