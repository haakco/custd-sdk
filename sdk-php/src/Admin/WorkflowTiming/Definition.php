<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * Definition is one tenant-scoped workflow shape with its current revision. The
 * revision number and hash are the provenance a duration history is read back
 * with, so they are typed rather than left in the payload.
 */
final readonly class Definition
{
    /** @param list<StepDeclaration> $steps */
    public function __construct(
        public string $uuid = '',
        public string $workflowKey = '',
        public string $name = '',
        public string $description = '',
        public string $status = '',
        public int $revisionNumber = 0,
        public string $revisionHash = '',
        public bool $allowOverlap = false,
        public int $revisionCount = 0,
        public array $steps = [],
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        $revision = Payload::object($payload, 'currentRevision');
        return new self(
            Payload::string($payload, 'uuid'),
            Payload::string($payload, 'workflowKey'),
            Payload::string($payload, 'name'),
            Payload::optionalString($payload, 'description') ?? '',
            Payload::string($payload, 'status'),
            Payload::optionalInteger($revision, 'number') ?? 0,
            Payload::optionalString($revision, 'hash') ?? '',
            Payload::boolean($revision, 'allowOverlap'),
            Payload::optionalInteger($payload, 'revisionCount') ?? 0,
            array_map(
                static fn (array $item): StepDeclaration => StepDeclaration::fromPayload($item),
                Payload::objects($revision, 'steps'),
            ),
        );
    }
}
