<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteTechnicalTrends
{
    /** @param list<SiteRegionalTrendMatch> $matches */
    public function __construct(
        public string $source,
        public bool $stale,
        public array $matches,
        public ?string $checkedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'source'),
            Fields::boolean($payload, 'stale'),
            array_map(SiteRegionalTrendMatch::fromPayload(...), Fields::objects($payload, 'matches')),
            Fields::optionalString($payload, 'checkedAt'),
        );
    }
}
