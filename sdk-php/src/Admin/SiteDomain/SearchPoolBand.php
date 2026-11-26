<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SearchPoolBand is a pooled query's monthly impressions (a DEMAND_* value) and where the pool ranks for it. */
final readonly class SearchPoolBand
{
    public const DEMAND_100_999 = '100_999';
    public const DEMAND_1K_10K = '1k_10k';
    public const DEMAND_10K_100K = '10k_100k';
    public const DEMAND_100K_PLUS = '100k_plus';

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
