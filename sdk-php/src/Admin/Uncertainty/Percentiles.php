<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class Percentiles
{
    public function __construct(
        public float $p25,
        public float $p5,
        public float $p50,
        public float $p75,
        public float $p95,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'p25'),
            Fields::number($payload, 'p5'),
            Fields::number($payload, 'p50'),
            Fields::number($payload, 'p75'),
            Fields::number($payload, 'p95'),
        );
    }
}
