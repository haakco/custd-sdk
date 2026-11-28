<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UnitPrice
{
    public function __construct(
        public string $currency,
        public string $amount,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'currency'),
            Fields::string($payload, 'amount'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'currency' => $this->currency,
            'amount' => $this->amount,
        ];
    }
}
