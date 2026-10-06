<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics;

use HaakCo\Custd\Fields;

/** TimingSummary is the server-measured lag and coverage for a query. */
final readonly class TimingSummary
{
    public function __construct(
        public int $eventLagP50Ms = 0,
        public int $eventLagP95Ms = 0,
        public int $eventLagMaxMs = 0,
        public int $queryDurationMs = 0,
        public int $snapshotAgeMs = 0,
        public string $oldestEventTimestamp = '',
        public string $newestEventTimestamp = '',
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Fields::integer($payload, 'eventLagP50Ms'),
            Fields::integer($payload, 'eventLagP95Ms'),
            Fields::integer($payload, 'eventLagMaxMs'),
            Fields::integer($payload, 'queryDurationMs'),
            Fields::integer($payload, 'snapshotAgeMs'),
            Fields::optionalString($payload, 'oldestEventTimestamp') ?? '',
            Fields::optionalString($payload, 'newestEventTimestamp') ?? '',
        );
    }
}
