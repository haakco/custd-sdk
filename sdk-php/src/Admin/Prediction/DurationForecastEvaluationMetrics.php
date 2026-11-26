<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class DurationForecastEvaluationMetrics
{
    public function __construct(
        public DurationForecastEvaluationMetric $nominal,
        public DurationForecastEvaluationMetric $shrinkage,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            DurationForecastEvaluationMetric::fromPayload(Fields::object($payload, 'nominal')),
            DurationForecastEvaluationMetric::fromPayload(Fields::object($payload, 'shrinkage')),
        );
    }
}
