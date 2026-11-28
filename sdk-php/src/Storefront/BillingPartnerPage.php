<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class BillingPartnerPage
{
    /**
     * @param  list<BillingPartner>  $partners
     */
    public function __construct(
        public array $partners,
        public ?string $nextAfter = null,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(BillingPartner::fromPayload(...), Fields::optionalObjects($payload, 'partners') ?? []),
            Fields::optionalString($payload, 'nextAfter'),
        );
    }
}
