<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteSearchDay
{
    public function __construct(
        public string $day,
        public int $clicks,
        public int $impressions,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'day'),
            Fields::integer($payload, 'clicks'),
            Fields::integer($payload, 'impressions'),
        );
    }
}
