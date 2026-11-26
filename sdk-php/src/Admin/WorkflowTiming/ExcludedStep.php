<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** ExcludedStep is a step attempt left out of the run duration, with its outcome. */
final readonly class ExcludedStep
{
    public function __construct(
        public string $stepKey,
        public int $attempt,
        public string $outcome,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'stepKey'),
            Payload::integer($payload, 'attempt'),
            Payload::string($payload, 'outcome'),
        );
    }
}
