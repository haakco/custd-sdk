<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class BillingPartnerSellerPage
{
    /**
     * @param  list<BillingPartnerSeller>  $sellers
     */
    public function __construct(
        public array $sellers,
        public ?string $nextAfter = null,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(BillingPartnerSeller::fromPayload(...), Fields::optionalObjects($payload, 'sellers') ?? []),
            Fields::optionalString($payload, 'nextAfter'),
        );
    }
}
