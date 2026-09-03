<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class RunBlock
{
    public function __construct(
        public string $uuid = "",
        public int $sequence = 0,
        public string $status = "",
        public int $baselineMs = 0,
        public int $currentMs = 0,
        public ?int $allocatedAtStartMs = null,
        public int $actualActiveMs = 0,
        public ?string $wallStartedAt = null,
        public ?string $wallEndedAt = null,
        public bool $outcomeCensored = false,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, "uuid"),
            Payload::integer($payload, "sequence"),
            Payload::string($payload, "status"),
            Payload::integer($payload, "baselineMs"),
            Payload::integer($payload, "currentMs"),
            Payload::optionalInteger($payload, "allocatedAtStartMs"),
            Payload::integer($payload, "actualActiveMs"),
            Payload::optionalString($payload, "wallStartedAt"),
            Payload::optionalString($payload, "wallEndedAt"),
            Payload::boolean($payload, "outcomeCensored"),
        );
    }
}
