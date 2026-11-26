<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionThresholdEvent
{
    public function __construct(
        public string $dedupKey,
        public string $direction,
        public string $emittedAt,
        public string $hysteresisState,
        public float $observedValue,
        public float $threshold,
        public string $triggerRunUuid,
        public string $versionUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'dedup_key'),
            Fields::string($payload, 'direction'),
            Fields::string($payload, 'emitted_at'),
            Fields::string($payload, 'hysteresis_state'),
            Fields::number($payload, 'observed_value'),
            Fields::number($payload, 'threshold'),
            Fields::string($payload, 'trigger_run_uuid'),
            Fields::string($payload, 'version_uuid'),
        );
    }
}
