<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class SelectStorefrontAnalyticsDestination
{
    public function __construct(
        public string $siteUuid,
    ) {}

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'siteUuid' => $this->siteUuid,
        ];

        return $payload;
    }
}
