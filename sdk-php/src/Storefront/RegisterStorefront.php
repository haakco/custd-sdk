<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class RegisterStorefront
{
    public function __construct(
        public string $slug,
        public string $appUuid,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'slug' => $this->slug,
            'appUuid' => $this->appUuid,
        ];

        return $payload;
    }
}
