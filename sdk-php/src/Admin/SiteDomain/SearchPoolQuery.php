<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SearchPoolQuery is one pooled query with its SearchPoolDemandBand band and position ranges. */
final readonly class SearchPoolQuery
{
    /**
     * @param SearchPoolDemandBand::* $demandBand
     */
    public function __construct(
        public string $query,
        public string $demandBand,
        public SearchPoolPositions $positions,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'query'),
            Fields::string($payload, 'demandBand'),
            SearchPoolPositions::fromPayload(Fields::object($payload, 'positions')),
        );
    }
}
