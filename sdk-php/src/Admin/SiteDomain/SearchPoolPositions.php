<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SearchPoolPositions is the percent of pooled impressions in each position range, rounded to 5. */
final readonly class SearchPoolPositions
{
    public function __construct(
        public int $top3,
        public int $top10,
        public int $top20,
        public int $beyond20,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'top3'),
            Fields::integer($payload, 'top10'),
            Fields::integer($payload, 'top20'),
            Fields::integer($payload, 'beyond20'),
        );
    }
}
