<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** CreateSiteDomainRequest claims a host for one of the tenant's sites. */
final readonly class CreateSiteDomainRequest
{
    public function __construct(
        public string $siteUuid,
        public string $host,
    ) {
    }

    /** @return array<string, string> */
    public function serialise(): array
    {
        return ['siteUuid' => $this->siteUuid, 'host' => $this->host];
    }
}
