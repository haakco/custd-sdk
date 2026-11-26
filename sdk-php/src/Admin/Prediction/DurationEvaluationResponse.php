<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

/**
 * DurationEvaluationResponse is the typed boundary for one duration evaluation: its identity, the evaluation
 * artifact with its folds and metrics, the terminal-outcome tally and the version evidence.
 */
final readonly class DurationEvaluationResponse
{
    public function __construct(
        public string $definitionUuid,
        public string $planUuid,
        public string $semanticKey,
        public DurationForecastEvaluationArtifact $artifact,
        public DurationEvaluationOutcomeCounts $outcomes,
        public DurationEvaluationVersionEvidence $versionEvidence,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'definitionUuid'),
            Fields::string($payload, 'planUuid'),
            Fields::string($payload, 'semanticKey'),
            DurationForecastEvaluationArtifact::fromPayload(Fields::object($payload, 'artifact')),
            DurationEvaluationOutcomeCounts::fromPayload(Fields::object($payload, 'outcomes')),
            DurationEvaluationVersionEvidence::fromPayload(Fields::object($payload, 'versionEvidence')),
        );
    }
}
