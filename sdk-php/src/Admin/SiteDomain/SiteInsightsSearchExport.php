<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteInsightsSearchExport is a domain's rankings, URL inspections, IndexNow state and metric row count. */
final readonly class SiteInsightsSearchExport
{
    public function __construct(
        public SiteRankings $rankings,
        public SiteSearchInspectionList $inspections,
        public SiteIndexNowState $indexNow,
        public int $metricRows,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteRankings::fromPayload(Fields::object($payload, 'rankings')),
            SiteSearchInspectionList::fromPayload(Fields::object($payload, 'inspections')),
            SiteIndexNowState::fromPayload(Fields::object($payload, 'indexNow')),
            Fields::integer($payload, 'metricRows'),
        );
    }
}
