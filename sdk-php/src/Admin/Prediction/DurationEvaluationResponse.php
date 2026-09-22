<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * DurationEvaluationResponse is the typed boundary for one duration evaluation.
 * The artifact is kept as a decoded array because the measurement owner owns its
 * schema; the identity, outcome and version fields are typed here.
 */
final readonly class DurationEvaluationResponse
{
    /** @param array<string, mixed> $artifact */
    public function __construct(
        public string $definitionUuid = "",
        public string $planUuid = "",
        public string $semanticKey = "",
        public array $artifact = [],
        public DurationEvaluationOutcomeCounts $outcomes = new DurationEvaluationOutcomeCounts(),
        public DurationEvaluationVersionEvidence $versionEvidence = new DurationEvaluationVersionEvidence(),
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, "definitionUuid"),
            Payload::string($payload, "planUuid"),
            Payload::string($payload, "semanticKey"),
            Payload::object($payload, "artifact"),
            DurationEvaluationOutcomeCounts::fromPayload(Payload::object($payload, "outcomes")),
            DurationEvaluationVersionEvidence::fromPayload(Payload::object($payload, "versionEvidence")),
        );
    }
}
