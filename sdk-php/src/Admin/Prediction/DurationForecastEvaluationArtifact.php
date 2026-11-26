<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class DurationForecastEvaluationArtifact
{
    public function __construct(
        public string $contentSha256,
        public DurationForecastEvaluation $evaluation,
        public string $predictionVersionUuid,
        public string $schemaVersion,
        public string $source,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'content_sha256'),
            DurationForecastEvaluation::fromPayload(Fields::object($payload, 'evaluation')),
            Fields::string($payload, 'prediction_version_uuid'),
            Fields::string($payload, 'schema_version'),
            Fields::string($payload, 'source'),
        );
    }
}
