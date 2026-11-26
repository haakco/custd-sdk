<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastStoryObservation
{
    public function __construct(
        public string $observedAt,
        public float $value,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'observedAt'),
            Fields::number($payload, 'value'),
        );
    }
}
