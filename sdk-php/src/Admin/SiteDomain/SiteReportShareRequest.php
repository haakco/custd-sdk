<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** The server defaults to 30 days and accepts a lifetime of 1 to 90 days. */
final readonly class SiteReportShareRequest
{
    public function __construct(public int $expiresInDays = 30)
    {
    }

    /** @return array{expiresInDays: int} */
    public function serialise(): array
    {
        return ['expiresInDays' => $this->expiresInDays];
    }
}
