<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class Run
{
    /** @param list<RunBlock> $blocks */
    public function __construct(
        public string $uuid = "",
        public string $planUuid = "",
        public string $status = "",
        public int $streamVersion = 0,
        public ?string $scheduledStartsAt = null,
        public ?string $scheduledEndsAt = null,
        public ?string $effectiveStartsAt = null,
        public ?string $effectiveEndsAt = null,
        public string $startPolicy = "",
        public int $baselineHorizonMs = 0,
        public ?int $executableHorizonMs = null,
        public int $lostMs = 0,
        public int $unusedMs = 0,
        public int $overrunMs = 0,
        public string $currentBlockUuid = "",
        public array $blocks = [],
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        $executable = $payload["executableHorizonMs"] ?? null;
        if ($executable !== null && !is_int($executable)) {
            throw new \UnexpectedValueException("custd: time-plan executableHorizonMs must be an integer");
        }
        return new self(
            Payload::string($payload, "uuid"),
            Payload::string($payload, "planUuid"),
            Payload::string($payload, "status"),
            Payload::integer($payload, "streamVersion"),
            Payload::optionalString($payload, "scheduledStartsAt"),
            Payload::optionalString($payload, "scheduledEndsAt"),
            Payload::optionalString($payload, "effectiveStartsAt"),
            Payload::optionalString($payload, "effectiveEndsAt"),
            Payload::optionalString($payload, "startPolicy") ?? "",
            Payload::integer($payload, "baselineHorizonMs"),
            $executable,
            Payload::integer($payload, "lostMs"),
            Payload::integer($payload, "unusedMs"),
            Payload::integer($payload, "overrunMs"),
            Payload::optionalString($payload, "currentBlockUuid") ?? "",
            array_map(RunBlock::fromPayload(...), Payload::objects($payload, "blocks")),
        );
    }
}
