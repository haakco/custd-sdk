<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class PartnerFeeBalanceCurrency
{
    public function __construct(
        public Money $held,
        public Money $available,
        public Money $negative,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Money::fromPayload(Fields::object($payload, 'held')),
            Money::fromPayload(Fields::object($payload, 'available')),
            Money::fromPayload(Fields::object($payload, 'negative')),
        );
    }
}
