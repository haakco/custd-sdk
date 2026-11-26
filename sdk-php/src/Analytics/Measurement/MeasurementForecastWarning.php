<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastWarning
{
    public function __construct(
        public string $code,
        public string $message,
        public string $severity,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'code'),
            Fields::string($payload, 'message'),
            Fields::string($payload, 'severity'),
        );
    }
}
