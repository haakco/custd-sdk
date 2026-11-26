<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemMeasurement
{
    public function __construct(
        public string $observationUuid,
        public string $observedAt,
        public string $seriesUuid,
        public float $value,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'observationUuid'),
            Fields::string($payload, 'observedAt'),
            Fields::string($payload, 'seriesUuid'),
            Fields::number($payload, 'value'),
        );
    }
}
