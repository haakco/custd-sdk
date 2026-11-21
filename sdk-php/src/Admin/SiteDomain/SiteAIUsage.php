<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteAIUsage
{
    /** @param list<SiteAIUsageRow> $rows */
    public function __construct(
        public SiteAIUsagePeriod $period,
        public string $from,
        public string $until,
        public array $rows,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteAIUsagePeriod::from(Fields::string($payload, 'period')),
            Fields::string($payload, 'from'),
            Fields::string($payload, 'until'),
            array_map(SiteAIUsageRow::fromPayload(...), Fields::objects($payload, 'rows')),
        );
    }
}
