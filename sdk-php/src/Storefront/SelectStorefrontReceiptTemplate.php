<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class SelectStorefrontReceiptTemplate
{
    public function __construct(
        public string $revision,
    ) {}

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'revision' => $this->revision,
        ];

        return $payload;
    }
}
