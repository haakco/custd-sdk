<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class AcceptedBillingPartnerInvitation
{
    public function __construct(
        public string $sellerCompanyName,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'sellerCompanyName'),
        );
    }
}
