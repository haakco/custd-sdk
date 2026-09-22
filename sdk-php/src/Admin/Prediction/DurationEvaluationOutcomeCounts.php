<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * DurationEvaluationOutcomeCounts is the closed terminal-outcome tally an
 * evaluation reports beside the fold. Excluded outcomes stay visible here rather
 * than being silently folded into eligible samples.
 */
final readonly class DurationEvaluationOutcomeCounts
{
    public function __construct(
        public int $eligible = 0,
        public int $skipped = 0,
        public int $cancelled = 0,
        public int $notRun = 0,
        public int $censored = 0,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::integer($payload, "eligible"),
            Payload::integer($payload, "skipped"),
            Payload::integer($payload, "cancelled"),
            Payload::integer($payload, "notRun"),
            Payload::integer($payload, "censored"),
        );
    }
}
