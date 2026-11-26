<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastStoryEstimate
{
    public function __construct(
        public string $estimatedAt,
        public string $high,
        public string $low,
        public float $widthDays,
        public ?float $movementDays = null,
        public ?string $note = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'estimatedAt'),
            Fields::string($payload, 'high'),
            Fields::string($payload, 'low'),
            Fields::number($payload, 'widthDays'),
            Fields::optionalNumber($payload, 'movementDays'),
            Fields::optionalString($payload, 'note'),
        );
    }
}
