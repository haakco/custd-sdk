<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionEvaluationSummary
{
    public function __construct(
        public int $negativeCount,
        public int $positiveCount,
        public int $resolvedRunCount,
        public int $sparseBucketCount,
        public string $windowEndAt,
        public string $windowStartAt,
        public ?float $brierScore = null,
        public ?float $logLoss = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'negative_count'),
            Fields::integer($payload, 'positive_count'),
            Fields::integer($payload, 'resolved_run_count'),
            Fields::integer($payload, 'sparse_bucket_count'),
            Fields::string($payload, 'window_end_at'),
            Fields::string($payload, 'window_start_at'),
            Fields::optionalNumber($payload, 'brier_score'),
            Fields::optionalNumber($payload, 'log_loss'),
        );
    }
}
