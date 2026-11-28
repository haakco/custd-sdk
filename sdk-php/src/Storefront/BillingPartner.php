<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class BillingPartner
{
    public function __construct(
        public string $partnerCompanyUuid,
        public string $name,
        public bool $active,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'partnerCompanyUuid'),
            Fields::string($payload, 'name'),
            Fields::boolean($payload, 'active'),
        );
    }
}
