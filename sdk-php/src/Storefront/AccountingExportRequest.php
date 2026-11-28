<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class AccountingExportRequest
{
    public function __construct(
        public string $month,
        public string $businessTimeZone,
        public ?string $after = null,
    ) {
    }
}
