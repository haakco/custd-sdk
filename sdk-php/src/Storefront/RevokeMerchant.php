<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class RevokeMerchant
{
    public function __construct(
        public int $expectedRevision,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'expectedRevision' => $this->expectedRevision,
        ];

        return $payload;
    }
}
