<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class BillingPartnerSeller
{
    public function __construct(
        public string $sellerCompanyUuid,
        public string $name,
        public bool $active,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'sellerCompanyUuid'),
            Fields::string($payload, 'name'),
            Fields::boolean($payload, 'active'),
        );
    }
}
