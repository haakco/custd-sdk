<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class DurationForecastEvaluationMetric
{
    /**
     * @param DurationForecastMethod::* $method
     */
    public function __construct(
        public int $evaluatedFoldCount,
        public DurationForecastIntervalEvaluation $interval,
        public float $meanAbsoluteErrorMs,
        public string $method,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'evaluated_fold_count'),
            DurationForecastIntervalEvaluation::fromPayload(Fields::object($payload, 'interval')),
            Fields::number($payload, 'mean_absolute_error_ms'),
            Fields::string($payload, 'method'),
        );
    }
}
