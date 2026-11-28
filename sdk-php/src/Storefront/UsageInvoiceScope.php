<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UsageInvoiceScope
{
    public function __construct(
        public string $sellerCompanyUuid,
        public string $appUuid,
        public string $buyerCompanyUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'sellerCompanyUuid'),
            Fields::string($payload, 'appUuid'),
            Fields::string($payload, 'buyerCompanyUuid'),
        );
    }
}
