<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class DurationForecastEvaluation
{
    /**
     * @param list<DurationForecastEvaluationFold> $folds
     */
    public function __construct(
        public string $asOf,
        public DurationForecastDefinition $definition,
        public int $foldCount,
        public array $folds,
        public string $inputHash,
        public DurationForecastEvaluationMetrics $metrics,
        public int $minimumTrainingHistory,
        public string $primaryMetric,
        public string $projectId,
        public string $seriesId,
        public string $tenantId,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'as_of'),
            DurationForecastDefinition::fromPayload(Fields::object($payload, 'definition')),
            Fields::integer($payload, 'fold_count'),
            array_map(DurationForecastEvaluationFold::fromPayload(...), Fields::objects($payload, 'folds')),
            Fields::string($payload, 'input_hash'),
            DurationForecastEvaluationMetrics::fromPayload(Fields::object($payload, 'metrics')),
            Fields::integer($payload, 'minimum_training_history'),
            Fields::string($payload, 'primary_metric'),
            Fields::string($payload, 'project_id'),
            Fields::string($payload, 'series_id'),
            Fields::string($payload, 'tenant_id'),
        );
    }
}
