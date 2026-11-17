<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteSearchInspectionList is a domain's latest URL inspections and the tenant's use of its daily limit. */
final readonly class SiteSearchInspectionList
{
    /** @param list<SiteSearchInspection> $inspections */
    public function __construct(
        public array $inspections,
        public int $dailyLimit,
        public int $usedToday,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(SiteSearchInspection::fromPayload(...), Fields::objects($payload, 'inspections')),
            Fields::integer($payload, 'dailyLimit'),
            Fields::integer($payload, 'usedToday'),
        );
    }
}
