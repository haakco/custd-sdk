<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** StepDefinition is one compiled step of an immutable revision. */
final readonly class StepDefinition
{
    public function __construct(
        public string $stepKey = '',
        public string $name = '',
        public int $sequence = 0,
        public int $nominalMs = 0,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'stepKey'),
            Payload::string($payload, 'name'),
            Payload::integer($payload, 'sequence'),
            Payload::integer($payload, 'nominalMs'),
        );
    }
}
