<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class PartnerPayoutPageRequest
{
    public function __construct(
        public string $partnerCompanyUuid,
        public ?string $before = null,
    ) {
    }
}
