<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class DurationForecastInterval
{
    public function __construct(
        public ?int $p10Ms = null,
        public ?int $p90Ms = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalInteger($payload, 'p10_ms'),
            Fields::optionalInteger($payload, 'p90_ms'),
        );
    }
}
