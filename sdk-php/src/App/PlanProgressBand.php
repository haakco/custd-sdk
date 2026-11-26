<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class PlanProgressBand
{
    public function __construct(
        public string $at,
        public int $lower,
        public int $median,
        public int $upper,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'at'),
            Fields::integer($payload, 'lower'),
            Fields::integer($payload, 'median'),
            Fields::integer($payload, 'upper'),
        );
    }
}
