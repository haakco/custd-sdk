<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteFindingImpactSource is one search provider's numbers before and after a fix; status is a
 * SiteFindingImpact::STATUS_* value and granularity "daily" or "weekly".
 */
final readonly class SiteFindingImpactSource
{
    public function __construct(
        public SiteSearchProvider $provider,
        public string $source,
        public string $granularity,
        public string $status,
        public SiteSearchImpactPeriod $before,
        public SiteSearchImpactPeriod $after,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteSearchProvider::from(Fields::string($payload, 'provider')),
            Fields::string($payload, 'source'),
            Fields::string($payload, 'granularity'),
            Fields::string($payload, 'status'),
            SiteSearchImpactPeriod::fromPayload(Fields::object($payload, 'before')),
            SiteSearchImpactPeriod::fromPayload(Fields::object($payload, 'after')),
        );
    }
}
