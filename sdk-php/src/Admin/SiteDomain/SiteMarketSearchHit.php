<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** One sampled search result. authority is the source's authority tier, or -1 when unknown. */
final readonly class SiteMarketSearchHit
{
    public function __construct(
        public string $title,
        public string $url,
        public int $authority,
        public ?string $date = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'title'),
            Fields::string($payload, 'url'),
            Fields::integer($payload, 'authority'),
            Fields::optionalString($payload, 'date'),
        );
    }
}
