<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class Tax
{
    public function __construct(
        public string $label,
        public string $rate,
        public string $rounding,
        public string $roundingPoint,
        public Money $amount,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'label'),
            Fields::string($payload, 'rate'),
            Fields::string($payload, 'rounding'),
            Fields::string($payload, 'roundingPoint'),
            Money::fromPayload(Fields::object($payload, 'amount')),
        );
    }
}
