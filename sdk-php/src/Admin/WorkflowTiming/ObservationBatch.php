<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Dto;

/** ObservationBatch is the body of one observations:batch request: at most one chunk of observations. */
final readonly class ObservationBatch implements Dto
{
    /** @param list<Observation> $observations */
    public function __construct(private array $observations)
    {
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return [
            'observations' => array_map(
                static fn (Observation $item): array => $item->toPayload(),
                $this->observations,
            ),
        ];
    }
}
