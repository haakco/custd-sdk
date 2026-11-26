<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteAnalyticsUnavailable is a GA4 report Custd does not import, and why. */
final readonly class SiteAnalyticsUnavailable
{
    /**
     * @param SiteAnalyticsUnavailableReport::* $report
     */
    public function __construct(
        public string $report,
        public string $reason,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'report'), Fields::string($payload, 'reason'));
    }
}
