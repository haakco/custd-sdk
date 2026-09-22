<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** ContributionEntry is one step's share of the active time of a run. */
final readonly class ContributionEntry
{
    public function __construct(
        public string $stepKey = '',
        public int $attempts = 0,
        public int $totalMs = 0,
        public int $baselineMs = 0,
        public int $contributionPermille = 0,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'stepKey'),
            Payload::integer($payload, 'attempts'),
            Payload::integer($payload, 'totalMs'),
            Payload::integer($payload, 'baselineMs'),
            Payload::integer($payload, 'contributionPermille'),
        );
    }
}
