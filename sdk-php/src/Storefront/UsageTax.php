<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UsageTax
{
    public function __construct(
        public string $label,
        public string $rate,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'label'),
            Fields::string($payload, 'rate'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'label' => $this->label,
            'rate' => $this->rate,
        ];

        return $payload;
    }
}
