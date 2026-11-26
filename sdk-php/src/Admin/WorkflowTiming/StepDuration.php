<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** StepDuration is one step attempt's duration fact. */
final readonly class StepDuration
{
    public function __construct(
        public string $stepKey,
        public int $attempt,
        public int $valueMs,
        public int $baselineMs,
        public string $startedAt,
        public string $finishedAt,
        public string $receiptAt,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'stepKey'),
            Payload::integer($payload, 'attempt'),
            Payload::integer($payload, 'valueMs'),
            Payload::integer($payload, 'baselineMs'),
            Payload::string($payload, 'startedAt'),
            Payload::string($payload, 'finishedAt'),
            Payload::string($payload, 'receiptAt'),
        );
    }
}
