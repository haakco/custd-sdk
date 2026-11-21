<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteInsightsReportsExport is a domain's saved reports and campaign links. */
final readonly class SiteInsightsReportsExport
{
    /** @param list<SavedSiteReport> $savedReports */
    public function __construct(
        public array $savedReports,
        public SiteCampaignLinkList $campaignLinks,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(SavedSiteReport::fromPayload(...), Fields::objects($payload, 'savedReports')),
            SiteCampaignLinkList::fromPayload(Fields::object($payload, 'campaignLinks')),
        );
    }
}
