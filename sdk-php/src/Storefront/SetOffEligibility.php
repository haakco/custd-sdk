<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class SetOffEligibility
{
    public function __construct(
        public bool $eligible,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'eligible'),
        );
    }
}
