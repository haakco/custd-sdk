<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class VerifyMerchant
{
    public function __construct(
        public string $appUuid,
        public string $invoiceUuid,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'appUuid' => $this->appUuid,
            'invoiceUuid' => $this->invoiceUuid,
        ];

        return $payload;
    }
}
