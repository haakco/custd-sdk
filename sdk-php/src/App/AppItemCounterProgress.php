<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemCounterProgress
{
    public function __construct(
        public ?float $current = null,
        public ?string $forecastP50 = null,
        public ?int $percent = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalNumber($payload, 'current'),
            Fields::optionalString($payload, 'forecastP50'),
            Fields::optionalInteger($payload, 'percent'),
        );
    }
}
