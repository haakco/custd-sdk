<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class LineQuantity
{
    public function __construct(
        public string $quantity,
    ) {}

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'quantity' => $this->quantity,
        ];
    }
}
