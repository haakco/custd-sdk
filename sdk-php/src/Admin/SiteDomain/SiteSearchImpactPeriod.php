<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteSearchImpactPeriod is one provider's search numbers for one window. status is a
 * SiteSearchImpactStatus value; an insufficient period has null clicks, impressions and ctr (never
 * 0) and says why in reason, while a measured period's 0 is a real 0.
 */
final readonly class SiteSearchImpactPeriod
{
    /**
     * @param SiteSearchImpactStatus::* $status
     */
    public function __construct(
        public string $status,
        public int $coveredDays,
        public int $expectedDays,
        public ?string $reason = null,
        public ?int $clicks = null,
        public ?int $impressions = null,
        public ?float $ctr = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'status'),
            Fields::integer($payload, 'coveredDays'),
            Fields::integer($payload, 'expectedDays'),
            Fields::optionalString($payload, 'reason'),
            Fields::optionalInteger($payload, 'clicks'),
            Fields::optionalInteger($payload, 'impressions'),
            Fields::optionalNumber($payload, 'ctr'),
        );
    }
}
