<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class ServicePeriod
{
    public function __construct(
        public string $start,
        public string $endExclusive,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'start'),
            Fields::string($payload, 'endExclusive'),
        );
    }
}
