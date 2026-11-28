<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class PartnerProductTermsPageRequest
{
    public function __construct(
        public string $storefront,
        public string $offerUuid,
        public ?string $before = null,
    ) {
    }
}
