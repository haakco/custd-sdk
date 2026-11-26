<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class PlanProgressPoint
{
    public function __construct(
        public string $at,
        public int $completed,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'at'),
            Fields::integer($payload, 'completed'),
        );
    }
}
