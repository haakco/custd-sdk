<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteRegionalTrends
{
    /** @param list<SiteRegionalTrendMarket> $markets */
    public function __construct(
        public string $siteUuid,
        public string $source,
        public bool $hasSavedTerms,
        public array $markets,
        public ?SiteTechnicalTrends $technical = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $technical = Fields::optionalObject($payload, 'technical');
        return new self(
            Fields::string($payload, 'siteUuid'),
            Fields::string($payload, 'source'),
            Fields::boolean($payload, 'hasSavedTerms'),
            array_map(SiteRegionalTrendMarket::fromPayload(...), Fields::objects($payload, 'markets')),
            $technical === null ? null : SiteTechnicalTrends::fromPayload($technical),
        );
    }
}
