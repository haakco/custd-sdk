<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SitePageSearchQuery is one query a page ranks for and where the page already uses it. */
final readonly class SitePageSearchQuery
{
    public function __construct(
        public string $query,
        public int $clicks,
        public int $impressions,
        public float $position,
        public bool $inTitle,
        public bool $inDescription,
        public bool $inH1,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'query'),
            Fields::integer($payload, 'clicks'),
            Fields::integer($payload, 'impressions'),
            Fields::number($payload, 'position'),
            Fields::boolean($payload, 'inTitle'),
            Fields::boolean($payload, 'inDescription'),
            Fields::boolean($payload, 'inH1'),
        );
    }
}
