<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** RebuildResult reports one bounded, deterministic projection rebuild of a run. */
final readonly class RebuildResult
{
    public function __construct(
        public string $runUuid,
        public string $workflowKey,
        public string $externalRunId,
        public int $facts,
        public RunProjectionStatus $status,
        public int $observationsWritten,
        public RunProjection $projection,
        public DurationProjection $durations,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'runUuid'),
            Payload::string($payload, 'workflowKey'),
            Payload::string($payload, 'externalRunId'),
            Payload::integer($payload, 'facts'),
            RunProjectionStatus::fromPayload(Payload::object($payload, 'status')),
            Payload::integer($payload, 'observationsWritten'),
            RunProjection::fromPayload(Payload::object($payload, 'projection')),
            DurationProjection::fromPayload(Payload::object($payload, 'durations')),
        );
    }
}
