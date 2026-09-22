<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * ObservedRun is the folded state of one observed run. The run and its steps are
 * read back from Custd, so a consumer never has to reconstruct them.
 */
final readonly class ObservedRun
{
    public function __construct(
        public string $runUuid = '',
        public string $workflowKey = '',
        public string $externalRunId = '',
        public string $state = '',
        public RunProjectionStatus $projectionStatus = new RunProjectionStatus(),
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'runUuid'),
            Payload::string($payload, 'workflowKey'),
            Payload::string($payload, 'externalRunId'),
            Payload::string($payload, 'state'),
            RunProjectionStatus::fromPayload(Payload::object($payload, 'projectionStatus')),
        );
    }
}
