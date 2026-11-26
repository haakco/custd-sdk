<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteGapCompetitor is one competitor the gap read, with its SiteWebInventoryStatus states. */
final readonly class SiteGapCompetitor
{
    public function __construct(
        public string $domain,
        public string $sitemapStatus,
        public string $waybackStatus,
        public int $pageCount,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domain'),
            Fields::string($payload, 'sitemapStatus'),
            Fields::string($payload, 'waybackStatus'),
            Fields::integer($payload, 'pageCount'),
        );
    }
}
