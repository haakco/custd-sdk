<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionCalibrationBucket
{
    public function __construct(
        public float $lower,
        public int $positiveCount,
        public float $predicted,
        public int $sampleCount,
        public float $upper,
        public ?float $observedRate = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'lower'),
            Fields::integer($payload, 'positiveCount'),
            Fields::number($payload, 'predicted'),
            Fields::integer($payload, 'sampleCount'),
            Fields::number($payload, 'upper'),
            Fields::optionalNumber($payload, 'observedRate'),
        );
    }
}
