<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * RunTimingSummary is the timing split of the latest completed run. Active time
 * is the union of measured step intervals, so overlapping steps are never summed
 * into a wall clock that did not happen.
 */
final readonly class RunTimingSummary
{
    public function __construct(
        public string $runUuid = '',
        public int $wallClockMs = 0,
        public int $activeMs = 0,
        public int $waitMs = 0,
        public int $nominalMs = 0,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'runUuid'),
            Payload::integer($payload, 'wallClockMs'),
            Payload::integer($payload, 'activeMs'),
            Payload::integer($payload, 'waitMs'),
            Payload::integer($payload, 'nominalMs'),
        );
    }
}
