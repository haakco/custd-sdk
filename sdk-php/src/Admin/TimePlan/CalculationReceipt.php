<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class CalculationReceipt
{
    /**
     * @param list<Allocation> $source
     * @param list<Allocation> $result
     * @param list<CalculationChange> $changes
     */
    public function __construct(
        public string $allocatorVersion = "",
        public string $reason = "",
        public string $summary = "",
        public array $source = [],
        public array $result = [],
        public array $changes = [],
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, "allocatorVersion"),
            Payload::string($payload, "reason"),
            Payload::string($payload, "summary"),
            array_map(Allocation::fromPayload(...), Payload::objects($payload, "source")),
            array_map(Allocation::fromPayload(...), Payload::objects($payload, "result")),
            array_map(CalculationChange::fromPayload(...), Payload::objects($payload, "changes")),
        );
    }
}
