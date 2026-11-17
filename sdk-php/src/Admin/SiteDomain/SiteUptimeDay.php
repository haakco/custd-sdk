<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteUptimeDay
{
    public function __construct(
        public string $date,
        public int $checks,
        public int $upChecks,
        public ?float $upPercent = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'date'),
            Fields::integer($payload, 'checks'),
            Fields::integer($payload, 'upChecks'),
            Fields::optionalNumber($payload, 'upPercent'),
        );
    }
}
