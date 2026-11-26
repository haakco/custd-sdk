<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class DurationForecastEvaluationFold
{
    public function __construct(
        public int $actualMs,
        public int $foldNumber,
        public string $heldOutRunId,
        public int $nominalAbsoluteErrorMs,
        public int $nominalPointMs,
        public string $observedAt,
        public int $shrinkageAbsoluteErrorMs,
        public DurationForecastInterval $shrinkageInterval,
        public int $shrinkagePointMs,
        public int $trainingSampleCount,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'actual_ms'),
            Fields::integer($payload, 'fold_number'),
            Fields::string($payload, 'held_out_run_id'),
            Fields::integer($payload, 'nominal_absolute_error_ms'),
            Fields::integer($payload, 'nominal_point_ms'),
            Fields::string($payload, 'observed_at'),
            Fields::integer($payload, 'shrinkage_absolute_error_ms'),
            DurationForecastInterval::fromPayload(Fields::object($payload, 'shrinkage_interval')),
            Fields::integer($payload, 'shrinkage_point_ms'),
            Fields::integer($payload, 'training_sample_count'),
        );
    }
}
