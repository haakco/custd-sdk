<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** DimensionDefinition is one declared comparison dimension of a revision. */
final readonly class DimensionDefinition
{
    public function __construct(
        public string $dimensionKey = '',
        public int $maxValueBytes = 0,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, 'dimensionKey'),
            Payload::integer($payload, 'maxValueBytes'),
        );
    }
}
