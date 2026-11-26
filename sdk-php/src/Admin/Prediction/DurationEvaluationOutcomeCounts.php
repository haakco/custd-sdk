<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

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

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'eligible'),
            Fields::integer($payload, 'skipped'),
            Fields::integer($payload, 'cancelled'),
            Fields::integer($payload, 'notRun'),
            Fields::integer($payload, 'censored'),
        );
    }
}
