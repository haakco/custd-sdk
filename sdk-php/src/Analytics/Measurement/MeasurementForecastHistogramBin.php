<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastHistogramBin
{
    public function __construct(
        public int $count,
        public string $end,
        public string $start,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'count'),
            Fields::string($payload, 'end'),
            Fields::string($payload, 'start'),
        );
    }
}
