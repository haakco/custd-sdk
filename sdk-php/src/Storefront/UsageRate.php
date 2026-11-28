<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UsageRate
{
    public function __construct(
        public string $currency,
        public string $majorAmount,
        public string $perUnits,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'currency'),
            Fields::string($payload, 'majorAmount'),
            Fields::string($payload, 'perUnits'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'currency' => $this->currency,
            'majorAmount' => $this->majorAmount,
            'perUnits' => $this->perUnits,
        ];

        return $payload;
    }
}
