<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** OutcomeCounts is the closed outcome tally of a workflow. */
final readonly class OutcomeCounts
{
    public function __construct(
        public int $completedRuns = 0,
        public int $failedRuns = 0,
        public int $cancelledRuns = 0,
        public int $runningRuns = 0,
        public int $completedSteps = 0,
        public int $failedAttempts = 0,
        public int $skippedAttempts = 0,
        public int $cancelledSteps = 0,
        public int $openAttempts = 0,
        public int $retries = 0,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::integer($payload, 'completedRuns'),
            Payload::integer($payload, 'failedRuns'),
            Payload::integer($payload, 'cancelledRuns'),
            Payload::integer($payload, 'runningRuns'),
            Payload::integer($payload, 'completedSteps'),
            Payload::integer($payload, 'failedAttempts'),
            Payload::integer($payload, 'skippedAttempts'),
            Payload::integer($payload, 'cancelledSteps'),
            Payload::integer($payload, 'openAttempts'),
            Payload::integer($payload, 'retries'),
        );
    }
}
