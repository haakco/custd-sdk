<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastStoryTarget
{
    public function __construct(
        public bool $available,
        public string $label,
        public float $value,
        public ?string $deadline = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'available'),
            Fields::string($payload, 'label'),
            Fields::number($payload, 'value'),
            Fields::optionalString($payload, 'deadline'),
        );
    }
}
