<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteFindingCounts counts a domain's open findings by severity. */
final readonly class SiteFindingCounts
{
    public function __construct(
        public int $high,
        public int $medium,
        public int $low,
        public int $info,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'high'),
            Fields::integer($payload, 'medium'),
            Fields::integer($payload, 'low'),
            Fields::integer($payload, 'info'),
        );
    }
}
