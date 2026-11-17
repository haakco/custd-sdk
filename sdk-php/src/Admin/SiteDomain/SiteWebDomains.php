<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteWebDomains lists a Site's own and competitor domains with their web-data inventory. */
final readonly class SiteWebDomains
{
    /** @param list<SiteWebDomain> $domains */
    public function __construct(
        public string $siteUuid,
        public array $domains,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'siteUuid'),
            array_map(SiteWebDomain::fromPayload(...), Fields::objects($payload, 'domains')),
        );
    }
}
