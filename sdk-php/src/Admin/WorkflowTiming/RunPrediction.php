<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** RunPrediction is the completion expectation for one observed run and its steps. */
final readonly class RunPrediction
{
    /** @param list<Expectation> $steps */
    public function __construct(
        public string $runUuid = '',
        public string $workflowKey = '',
        public string $externalRunId = '',
        public string $state = '',
        public bool $allowOverlap = false,
        public string $generatedAt = '',
        public Expectation $run = new Expectation(),
        public array $steps = [],
    ) {
    }

    /** step returns the expectation for one declared step key. */
    public function step(string $stepKey): ?Expectation
    {
        foreach ($this->steps as $step) {
            if ($step->stepKey === $stepKey) {
                return $step;
            }
        }
        return null;
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'runUuid'),
            Payload::string($payload, 'workflowKey'),
            Payload::string($payload, 'externalRunId'),
            Payload::string($payload, 'state'),
            Payload::boolean($payload, 'allowOverlap'),
            Payload::string($payload, 'generatedAt'),
            Expectation::fromPayload(Payload::object($payload, 'run')),
            array_map(
                static fn (array $item): Expectation => Expectation::fromPayload($item),
                Payload::objects($payload, 'steps'),
            ),
        );
    }
}
