<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class Cart
{
    /**
     * @param  list<CartLine>  $lines
     */
    public function __construct(
        public string $cartUuid,
        public int $revision,
        public string $status,
        public string $currency,
        public string $createdAt,
        public array $lines,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'cartUuid'),
            Fields::integer($payload, 'revision'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'currency'),
            Fields::string($payload, 'createdAt'),
            array_map(CartLine::fromPayload(...), Fields::objects($payload, 'lines')),
        );
    }
}
