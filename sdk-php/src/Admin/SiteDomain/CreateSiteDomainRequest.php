<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * CreateSiteDomainRequest claims a host for one of the tenant's sites. A site-bound credential
 * (site_domains.manage) leaves the site null and gets its own Site; anyone else names it.
 */
final readonly class CreateSiteDomainRequest
{
    public function __construct(
        public ?string $siteUuid,
        public string $host,
    ) {
    }

    /** Claim a host for the calling site-bound credential's own Site. */
    public static function forOwnSite(string $host): self
    {
        return new self(null, $host);
    }

    /** @return array<string, string> */
    public function serialise(): array
    {
        if ($this->siteUuid === null || $this->siteUuid === '') {
            return ['host' => $this->host];
        }

        return ['siteUuid' => $this->siteUuid, 'host' => $this->host];
    }
}
