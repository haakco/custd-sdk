<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class AnalyticsDestination
{
    public function __construct(
        public bool $enabled,
        public ?string $siteUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'enabled'),
            Fields::optionalString($payload, 'siteUuid'),
        );
    }
}
