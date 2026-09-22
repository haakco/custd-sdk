<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * ObservationResult is the per-item outcome of an append. A transport-level
 * success is not a successful append: the caller must read `accepted`.
 */
final readonly class ObservationResult
{
    public function __construct(
        public int $index = 0,
        public bool $accepted = false,
        public bool $duplicate = false,
        public string $workflowKey = '',
        public string $externalRunId = '',
        public string $idempotencyKey = '',
        public string $runUuid = '',
        public string $factUuid = '',
        public string $errorCode = '',
        public string $errorMessage = '',
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::integer($payload, 'index'),
            Payload::boolean($payload, 'accepted'),
            Payload::boolean($payload, 'duplicate'),
            Payload::string($payload, 'workflowKey'),
            Payload::string($payload, 'externalRunId'),
            Payload::string($payload, 'idempotencyKey'),
            Payload::optionalString($payload, 'runUuid') ?? '',
            Payload::optionalString($payload, 'factUuid') ?? '',
            Payload::optionalString($payload, 'errorCode') ?? '',
            Payload::optionalString($payload, 'errorMessage') ?? '',
        );
    }
}
