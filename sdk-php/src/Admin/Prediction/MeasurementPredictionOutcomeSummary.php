<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionOutcomeSummary
{
    public function __construct(
        public bool $isLateEvidence,
        public int $observedValue,
        public string $outcomeKind,
        public string $resolution,
        public string $runUuid,
        public ?string $resolvedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'is_late_evidence'),
            Fields::integer($payload, 'observed_value'),
            Fields::string($payload, 'outcome_kind'),
            Fields::string($payload, 'resolution'),
            Fields::string($payload, 'run_uuid'),
            Fields::optionalString($payload, 'resolved_at'),
        );
    }
}
