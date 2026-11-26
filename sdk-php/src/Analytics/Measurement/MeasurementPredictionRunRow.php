<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionRunRow
{
    public function __construct(
        public string $asOf,
        public float $baseline,
        public int $contributionCount,
        public string $generatedAt,
        public string $horizonEnd,
        public string $inputHash,
        public float $output,
        public bool $overrideApplied,
        public string $runUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'asOf'),
            Fields::number($payload, 'baseline'),
            Fields::integer($payload, 'contributionCount'),
            Fields::string($payload, 'generatedAt'),
            Fields::string($payload, 'horizonEnd'),
            Fields::string($payload, 'inputHash'),
            Fields::number($payload, 'output'),
            Fields::boolean($payload, 'overrideApplied'),
            Fields::string($payload, 'runUuid'),
        );
    }
}
