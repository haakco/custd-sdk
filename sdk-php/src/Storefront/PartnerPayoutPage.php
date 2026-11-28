<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class PartnerPayoutPage
{
    /**
     * @param  list<PartnerPayout>  $payouts
     */
    public function __construct(
        public array $payouts,
        public ?string $nextBefore = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(PartnerPayout::fromPayload(...), Fields::optionalObjects($payload, 'payouts') ?? []),
            Fields::optionalString($payload, 'nextBefore'),
        );
    }
}
