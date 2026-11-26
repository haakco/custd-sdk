<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastLine
{
    /**
     * @param list<MeasurementForecastPoint> $points
     */
    public function __construct(
        public array $points,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(MeasurementForecastPoint::fromPayload(...), Fields::objects($payload, 'points')),
        );
    }
}
