<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** RunDuration is the whole-run duration fact a rebuild wrote. */
final readonly class RunDuration
{
    public function __construct(
        public int $valueMs,
        public int $baselineMs,
        public string $startedAt,
        public string $finishedAt,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::integer($payload, 'valueMs'),
            Payload::integer($payload, 'baselineMs'),
            Payload::string($payload, 'startedAt'),
            Payload::string($payload, 'finishedAt'),
        );
    }
}
