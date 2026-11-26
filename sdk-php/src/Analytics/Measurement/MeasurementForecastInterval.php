<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastInterval
{
    public function __construct(
        public float $confidence,
        public string $lower,
        public string $upper,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'confidence'),
            Fields::string($payload, 'lower'),
            Fields::string($payload, 'upper'),
        );
    }
}
