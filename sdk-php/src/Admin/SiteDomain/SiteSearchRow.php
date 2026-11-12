<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteSearchRow is one page URL or query text and its totals. */
final readonly class SiteSearchRow
{
    public function __construct(
        public SiteSearchProvider $provider,
        public string $key,
        public SiteSearchTotals $totals,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteSearchProvider::from(Fields::string($payload, 'provider')),
            Fields::string($payload, 'key'),
            SiteSearchTotals::fromPayload(Fields::object($payload, 'totals')),
        );
    }
}
