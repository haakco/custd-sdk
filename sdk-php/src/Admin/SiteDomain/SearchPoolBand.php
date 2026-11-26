<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SearchPoolBand is a pooled query's monthly impressions (a SearchPoolDemandBand value) and where the pool ranks for it. */
final readonly class SearchPoolBand
{
    /**
     * @param SearchPoolDemandBand::* $demandBand
     */
    public function __construct(
        public string $demandBand,
        public SearchPoolPositions $positions,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'demandBand'),
            SearchPoolPositions::fromPayload(Fields::object($payload, 'positions')),
        );
    }
}
