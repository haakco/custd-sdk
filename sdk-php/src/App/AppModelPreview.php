<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppModelPreview
{
    public function __construct(
        public float $p5,
        public float $p50,
        public float $p95,
        public string $quantity,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'p5'),
            Fields::number($payload, 'p50'),
            Fields::number($payload, 'p95'),
            Fields::string($payload, 'quantity'),
        );
    }
}
