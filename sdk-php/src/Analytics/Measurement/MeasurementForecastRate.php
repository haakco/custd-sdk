<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastRate
{
    public function __construct(
        public float $perDay,
        public float $perHour,
        public float $perMinute,
        public float $perSecond,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'perDay'),
            Fields::number($payload, 'perHour'),
            Fields::number($payload, 'perMinute'),
            Fields::number($payload, 'perSecond'),
        );
    }
}
