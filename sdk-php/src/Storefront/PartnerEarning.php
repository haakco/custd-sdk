<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class PartnerEarning
{
    public function __construct(
        public Money $gross,
        public Money $tax,
        public Money $net,
        public Money $costToProvide,
        public Money $remainder,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Money::fromPayload(Fields::object($payload, 'gross')),
            Money::fromPayload(Fields::object($payload, 'tax')),
            Money::fromPayload(Fields::object($payload, 'net')),
            Money::fromPayload(Fields::object($payload, 'costToProvide')),
            Money::fromPayload(Fields::object($payload, 'remainder')),
        );
    }
}
