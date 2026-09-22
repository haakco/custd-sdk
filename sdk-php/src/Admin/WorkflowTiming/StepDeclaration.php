<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** StepDeclaration is one declared step of a workflow shape. */
final readonly class StepDeclaration
{
    public function __construct(
        public string $stepKey,
        public string $name,
        public int $nominalMs,
    ) {
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return ['stepKey' => $this->stepKey, 'name' => $this->name, 'nominalMs' => $this->nominalMs];
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'stepKey'),
            Payload::string($payload, 'name'),
            Payload::integer($payload, 'nominalMs'),
        );
    }
}
