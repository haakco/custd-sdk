<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteReportSearch
{
    /**
     * @param list<SiteSearchSource> $sources
     * @param list<SiteSearchRow> $topQueries
     * @param list<SiteSearchRow> $topPages
     * @param list<SiteSearchRow> $strikingDistance
     */
    public function __construct(
        public int $days,
        public bool $connected,
        public array $sources,
        public array $topQueries,
        public array $topPages,
        public array $strikingDistance,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'days'),
            Fields::boolean($payload, 'connected'),
            array_map(SiteSearchSource::fromPayload(...), Fields::objects($payload, 'sources')),
            array_map(SiteSearchRow::fromPayload(...), Fields::objects($payload, 'topQueries')),
            array_map(SiteSearchRow::fromPayload(...), Fields::objects($payload, 'topPages')),
            array_map(SiteSearchRow::fromPayload(...), Fields::objects($payload, 'strikingDistance')),
        );
    }
}
