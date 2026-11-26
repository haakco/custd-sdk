<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

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

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'uuid'),
            Fields::integer($payload, 'versionNumber'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'createdAt'),
        );
    }
}
