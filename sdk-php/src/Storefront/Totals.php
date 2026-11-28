<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class Totals
{
    public function __construct(
        public Money $netTotal,
        public Money $taxTotal,
        public Money $grossTotal,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Money::fromPayload(Fields::object($payload, 'netTotal')),
            Money::fromPayload(Fields::object($payload, 'taxTotal')),
            Money::fromPayload(Fields::object($payload, 'grossTotal')),
        );
    }
}
