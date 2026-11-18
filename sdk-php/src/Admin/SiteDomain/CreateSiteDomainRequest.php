<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * CreateSiteDomainRequest claims a host for one of the tenant's sites. A site-bound credential
 * (site_domains.manage) leaves the site null and gets its own Site. Anyone else may leave it null
 * too: Custd places the host on the Site holding it with or without www., else the Site named after
 * it, else the only Site, and refuses with SiteDomainClient::SITE_CHOICE_REQUIRED_CODE when that
 * decides no one Site. A tenant with no Site gets one named after the host (tenant-admin only).
 */
final readonly class CreateSiteDomainRequest
{
    public function __construct(
        public ?string $siteUuid,
        public string $host,
    ) {
    }

    /** Claim a host without naming its Site: a site-bound credential's own, or the Site Custd places it on. */
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
