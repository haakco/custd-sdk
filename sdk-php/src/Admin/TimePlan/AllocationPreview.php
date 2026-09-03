<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class AllocationPreview
{
    /** @param list<Allocation> $allocations */
    public function __construct(
        public string $allocatorVersion = "",
        public int $horizonMs = 0,
        public array $allocations = [],
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, "allocatorVersion"),
            Payload::integer($payload, "horizonMs"),
            array_map(Allocation::fromPayload(...), Payload::objects($payload, "allocations")),
        );
    }
}
