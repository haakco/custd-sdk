<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteWebPages is one page of a domain's inventoried URLs; pass next as after to read the next page, null
 * on the last one.
 */
final readonly class SiteWebPages
{
    /** @param list<SiteWebPage> $pages */
    public function __construct(
        public string $siteUuid,
        public string $domain,
        public array $pages,
        public ?string $next = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'siteUuid'),
            Fields::string($payload, 'domain'),
            array_map(SiteWebPage::fromPayload(...), Fields::objects($payload, 'pages')),
            Fields::optionalString($payload, 'next'),
        );
    }
}
