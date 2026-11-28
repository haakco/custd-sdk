<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class PartnerReferralPageRequest
{
    public function __construct(
        public ?string $before = null,
    ) {}
}
