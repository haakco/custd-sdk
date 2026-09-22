<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * WorkflowRevision is one immutable compiled workflow shape. History is read back
 * with the revision that was in force when it happened, so the number and hash are
 * typed rather than left in the payload.
 */
final readonly class WorkflowRevision
{
    /** @param list<DimensionDefinition> $dimensions
     *  @param list<StepDefinition> $steps
     */
    public function __construct(
        public string $uuid = '',
        public int $number = 0,
        public string $hash = '',
        public bool $allowOverlap = false,
        public string $predictionVersionUuid = '',
        public array $dimensions = [],
        public array $steps = [],
    ) {
    }

    /** step returns one compiled step by key. */
    public function step(string $stepKey): ?StepDefinition
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
            Payload::string($payload, 'uuid'),
            Payload::integer($payload, 'number'),
            Payload::string($payload, 'hash'),
            Payload::boolean($payload, 'allowOverlap'),
            Payload::optionalString($payload, 'predictionVersionUuid') ?? '',
            array_map(
                static fn (array $item): DimensionDefinition => DimensionDefinition::fromPayload($item),
                Payload::objects($payload, 'dimensions'),
            ),
            array_map(
                static fn (array $item): StepDefinition => StepDefinition::fromPayload($item),
                Payload::objects($payload, 'steps'),
            ),
        );
    }
}
