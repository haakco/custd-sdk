<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class PartnerStatementRequest
{
    public function __construct(
        public string $storefront,
        public string $partnerCompanyUuid,
        public string $month,
        public ?string $cursor = null,
    ) {}
}
