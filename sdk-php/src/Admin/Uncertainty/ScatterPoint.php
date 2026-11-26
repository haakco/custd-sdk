<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class ScatterPoint
{
    public function __construct(
        public float $input,
        public float $output,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'input'),
            Fields::number($payload, 'output'),
        );
    }
}
