<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class UsageInvoiceOptIn
{
    public function __construct(
        public bool $invoiceOnlyAttested,
    ) {}

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'invoiceOnlyAttested' => $this->invoiceOnlyAttested,
        ];

        return $payload;
    }
}
