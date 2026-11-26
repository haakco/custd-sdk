<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class DurationForecastIntervalEvaluation
{
    public function __construct(
        public int $availableFoldCount,
        public float $coverage,
        public int $coveredFoldCount,
        public float $meanWidthMs,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'available_fold_count'),
            Fields::number($payload, 'coverage'),
            Fields::integer($payload, 'covered_fold_count'),
            Fields::number($payload, 'mean_width_ms'),
        );
    }
}
