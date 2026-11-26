<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementOverviewPoint
{
    public function __construct(
        public string $label,
        public string $value,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'label'),
            Fields::string($payload, 'value'),
        );
    }
}
