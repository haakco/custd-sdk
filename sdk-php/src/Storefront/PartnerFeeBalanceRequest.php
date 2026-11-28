<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class PartnerFeeBalanceRequest
{
    public function __construct(
        public string $asOf,
    ) {
    }
}
