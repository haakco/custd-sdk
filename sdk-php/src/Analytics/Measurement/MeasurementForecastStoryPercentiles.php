<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastStoryPercentiles
{
    public function __construct(
        public ?string $p10 = null,
        public ?string $p25 = null,
        public ?string $p50 = null,
        public ?string $p75 = null,
        public ?string $p90 = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalString($payload, 'p10'),
            Fields::optionalString($payload, 'p25'),
            Fields::optionalString($payload, 'p50'),
            Fields::optionalString($payload, 'p75'),
            Fields::optionalString($payload, 'p90'),
        );
    }
}
