<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteTrendMonth is one month (YYYY-MM) of Wikipedia page views. */
final readonly class SiteTrendMonth
{
    public function __construct(
        public string $month,
        public int $views,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'month'),
            Fields::integer($payload, 'views'),
        );
    }
}
