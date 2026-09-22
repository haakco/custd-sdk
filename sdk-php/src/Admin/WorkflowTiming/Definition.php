<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** Definition is one tenant-scoped workflow shape with its current revision. */
final readonly class Definition
{
    public function __construct(
        public string $uuid = '',
        public string $workflowKey = '',
        public string $name = '',
        public string $description = '',
        public string $status = '',
        public int $revisionCount = 0,
        public WorkflowRevision $currentRevision = new WorkflowRevision(),
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'uuid'),
            Payload::string($payload, 'workflowKey'),
            Payload::string($payload, 'name'),
            Payload::optionalString($payload, 'description') ?? '',
            Payload::string($payload, 'status'),
            Payload::integer($payload, 'revisionCount'),
            WorkflowRevision::fromPayload(Payload::object($payload, 'currentRevision')),
        );
    }
}
