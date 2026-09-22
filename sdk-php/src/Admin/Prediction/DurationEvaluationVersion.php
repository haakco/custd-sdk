<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * DurationEvaluationVersion identifies the immutable prediction version an
 * evaluation was produced against, so a calibration number is always traceable
 * to the version that produced it.
 */
final readonly class DurationEvaluationVersion
{
    public function __construct(
        public string $uuid = "",
        public int $versionNumber = 0,
        public string $status = "",
        public string $createdAt = "",
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, "uuid"),
            Payload::integer($payload, "versionNumber"),
            Payload::string($payload, "status"),
            Payload::string($payload, "createdAt"),
        );
    }
}
