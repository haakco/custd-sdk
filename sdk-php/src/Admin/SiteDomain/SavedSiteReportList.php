<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SavedSiteReportList is a domain's saved reports and how many it may keep. */
final readonly class SavedSiteReportList
{
    /** How many saved reports a domain keeps. */
    public const MAX_REPORTS = 20;

    /** @param list<SavedSiteReportSummary> $reports */
    public function __construct(
        public array $reports,
        public int $maxReports,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(SavedSiteReportSummary::fromPayload(...), Fields::objects($payload, 'reports')),
            Fields::integer($payload, 'maxReports'),
        );
    }
}
