<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Dto;

/**
 * WorkflowDeclaration is the declarative workflow shape a consumer declares once.
 *
 * Repeating an identical declaration is a no-op; a change to the shape creates a
 * new forward-only revision, which is what keeps a spelling mistake from
 * silently starting a second duration series.
 */
final readonly class WorkflowDeclaration implements Dto
{
    /** @param list<string> $dimensions
     *  @param list<StepDeclaration> $steps
     */
    public function __construct(
        public string $workflowKey,
        public string $name,
        public string $description = '',
        public bool $allowOverlap = false,
        public array $dimensions = [],
        public array $steps = [],
        public bool $retired = false,
        public string $predictionVersionUuid = '',
    ) {
    }

    public function withStep(StepDeclaration $step): self
    {
        return new self(
            $this->workflowKey,
            $this->name,
            $this->description,
            $this->allowOverlap,
            $this->dimensions,
            [...$this->steps, $step],
            $this->retired,
            $this->predictionVersionUuid,
        );
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return array_filter([
            'workflowKey' => $this->workflowKey,
            'name' => $this->name,
            'description' => $this->description,
            'allowOverlap' => $this->allowOverlap,
            'dimensions' => $this->dimensions,
            'steps' => array_map(static fn (StepDeclaration $step): array => $step->toPayload(), $this->steps),
            'retired' => $this->retired,
            'predictionVersionUuid' => $this->predictionVersionUuid,
        ], static fn (mixed $value): bool => $value !== '' && $value !== []);
    }
}
