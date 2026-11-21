<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteInsightsMonitoringExport is a domain's findings, incidents, uptime and Lighthouse history.
 * findingRows counts every finding; findings holds fewer only past 10000. lighthouse has one
 * history per measured page, home page first.
 */
final readonly class SiteInsightsMonitoringExport
{
    /** @param list<SiteLighthouseHistory> $lighthouse */
    public function __construct(
        public SiteFindingList $findings,
        public int $findingRows,
        public SiteIncidentList $incidents,
        public SiteUptimeHistory $uptime,
        public array $lighthouse,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteFindingList::fromPayload(Fields::object($payload, 'findings')),
            Fields::integer($payload, 'findingRows'),
            SiteIncidentList::fromPayload(Fields::object($payload, 'incidents')),
            SiteUptimeHistory::fromPayload(Fields::object($payload, 'uptime')),
            array_map(SiteLighthouseHistory::fromPayload(...), Fields::objects($payload, 'lighthouse')),
        );
    }
}
