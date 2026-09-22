<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * DurationHistoryEntry is one completed duration fact together with the revision
 * that was in force when it happened, so history is never read with the wrong
 * shape.
 */
final readonly class DurationHistoryEntry
{
    public function __construct(
        public string $runUuid = '',
        public string $stepKey = '',
        public int $valueMs = 0,
        public int $baselineMs = 0,
        public string $revisionUuid = '',
        public int $revisionNumber = 0,
        public string $outcome = '',
        public bool $corrected = false,
        public string $observedAt = '',
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'runUuid'),
            Payload::string($payload, 'stepKey'),
            Payload::integer($payload, 'valueMs'),
            Payload::integer($payload, 'baselineMs'),
            Payload::string($payload, 'revisionUuid'),
            Payload::integer($payload, 'revisionNumber'),
            Payload::string($payload, 'outcome'),
            Payload::boolean($payload, 'corrected'),
            Payload::string($payload, 'observedAt'),
        );
    }
}
