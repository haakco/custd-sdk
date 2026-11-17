<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteSearchValuePage is one search page's totals and the goals credited to its landings. landings
 * and goalConversions are null when goals were not read; a present 0 is a real 0.
 */
final readonly class SiteSearchValuePage
{
    public function __construct(
        public SiteSearchProvider $provider,
        public string $source,
        public string $pageUrl,
        public string $path,
        public SiteSearchTotals $search,
        public ?int $landings = null,
        public ?int $goalConversions = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteSearchProvider::from(Fields::string($payload, 'provider')),
            Fields::string($payload, 'source'),
            Fields::string($payload, 'pageUrl'),
            Fields::string($payload, 'path'),
            SiteSearchTotals::fromPayload(Fields::object($payload, 'search')),
            Fields::optionalInteger($payload, 'landings'),
            Fields::optionalInteger($payload, 'goalConversions'),
        );
    }
}
