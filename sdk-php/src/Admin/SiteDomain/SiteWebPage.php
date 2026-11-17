<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteWebPage is one public URL a domain's inventory found; sources are SOURCE_* values and the days
 * are YYYY-MM-DD.
 */
final readonly class SiteWebPage
{
    public const SOURCE_SITEMAP = 'sitemap';
    public const SOURCE_WAYBACK = 'wayback';

    /** @param list<string> $sources */
    public function __construct(
        public string $url,
        public array $sources,
        public string $firstSeen,
        public string $lastSeen,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'url'),
            Fields::strings($payload, 'sources'),
            Fields::string($payload, 'firstSeen'),
            Fields::string($payload, 'lastSeen'),
        );
    }
}
