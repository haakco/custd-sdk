<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class CreatedRun
{
    /** @param list<Allocation> $blockAllocations */
    public function __construct(
        public string $uuid = "",
        public string $planUuid = "",
        public string $versionUuid = "",
        public string $status = "",
        public int $baselineHorizonMs = 0,
        public array $blockAllocations = [],
        public string $createdAt = "",
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, "uuid"),
            Payload::string($payload, "planUuid"),
            Payload::string($payload, "versionUuid"),
            Payload::string($payload, "status"),
            Payload::integer($payload, "baselineHorizonMs"),
            array_map(Allocation::fromPayload(...), Payload::objects($payload, "blockAllocations")),
            Payload::string($payload, "createdAt"),
        );
    }
}
