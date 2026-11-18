<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteReferringDomains is the domains linking to one of a Site's domains, by source. role is a
 * SiteWebDomain::ROLE_* value; authority is null when no Common Crawl graph has been read.
 */
final readonly class SiteReferringDomains
{
    /**
     * @param list<SiteLinkSourceTotal> $sources
     * @param list<SiteReferringDomain> $referringDomains
     */
    public function __construct(
        public string $siteUuid,
        public string $domain,
        public string $role,
        public array $sources,
        public array $referringDomains,
        public SiteLostLinks $lost,
        public ?SiteDomainAuthority $authority = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $authority = Fields::optionalObject($payload, 'authority');

        return new self(
            Fields::string($payload, 'siteUuid'),
            Fields::string($payload, 'domain'),
            Fields::string($payload, 'role'),
            array_map(SiteLinkSourceTotal::fromPayload(...), Fields::objects($payload, 'sources')),
            array_map(SiteReferringDomain::fromPayload(...), Fields::objects($payload, 'referringDomains')),
            SiteLostLinks::fromPayload(Fields::object($payload, 'lost')),
            $authority === null ? null : SiteDomainAuthority::fromPayload($authority),
        );
    }
}
