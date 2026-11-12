<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteSearchTotals are summed search numbers. ctr is 0..1; position is null when unknown. */
final readonly class SiteSearchTotals
{
    public function __construct(
        public int $clicks,
        public int $impressions,
        public float $ctr,
        public ?float $position = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'clicks'),
            Fields::integer($payload, 'impressions'),
            Fields::number($payload, 'ctr'),
            Fields::optionalNumber($payload, 'position'),
        );
    }
}
