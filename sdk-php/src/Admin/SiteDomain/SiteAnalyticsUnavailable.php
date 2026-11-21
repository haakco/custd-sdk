<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteAnalyticsUnavailable is a GA4 report Custd does not import, and why. */
final readonly class SiteAnalyticsUnavailable
{
    public const REPORT_ECOMMERCE = 'ecommerce';
    public const REPORT_AUDIENCE = 'audience';

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
