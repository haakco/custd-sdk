<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class BillingPartnerPageRequest
{
    public function __construct(
        public ?string $after = null,
    ) {
    }
}
