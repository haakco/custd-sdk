<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class CartLine
{
    public function __construct(
        public string $offerUuid,
        public string $priceRevisionUuid,
        public string $quantity,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'offerUuid'),
            Fields::string($payload, 'priceRevisionUuid'),
            Fields::string($payload, 'quantity'),
        );
    }
}
