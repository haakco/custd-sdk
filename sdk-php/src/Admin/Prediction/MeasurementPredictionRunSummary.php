<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionRunSummary
{
    public function __construct(
        public string $asOfAt,
        public float $baseline,
        public string $engineVersion,
        public string $generatedAt,
        public string $horizonEndAt,
        public string $inputHash,
        public float $output,
        public bool $overrideApplied,
        public string $runUuid,
        public int $warningCount,
        public ?int $durationMilliseconds = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'as_of_at'),
            Fields::number($payload, 'baseline'),
            Fields::string($payload, 'engine_version'),
            Fields::string($payload, 'generated_at'),
            Fields::string($payload, 'horizon_end_at'),
            Fields::string($payload, 'input_hash'),
            Fields::number($payload, 'output'),
            Fields::boolean($payload, 'override_applied'),
            Fields::string($payload, 'run_uuid'),
            Fields::integer($payload, 'warning_count'),
            Fields::optionalInteger($payload, 'duration_milliseconds'),
        );
    }
}
