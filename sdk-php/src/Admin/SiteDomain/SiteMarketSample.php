<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** An independent search result sample for a keyword list's public seed topic. */
final readonly class SiteMarketSample
{
    /** @param list<SiteMarketSearchHit> $hits */
    public function __construct(
        public string $observedAt,
        public array $hits,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'observedAt'),
            array_map(SiteMarketSearchHit::fromPayload(...), Fields::objects($payload, 'hits')),
        );
    }
}
