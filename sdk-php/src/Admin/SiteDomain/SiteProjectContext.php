<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteProjectContext is one Site's brand names, named competitors and markets, shared by every
 * domain of the Site. updatedAt is null until it is first set.
 */
final readonly class SiteProjectContext
{
    /**
     * @param list<string> $brandNames
     * @param list<string> $competitorDomains
     * @param list<SiteMarket> $markets
     */
    public function __construct(
        public string $siteUuid,
        public array $brandNames,
        public array $competitorDomains,
        public array $markets,
        public ?string $updatedAt = null,
        public bool $hackerNewsEnabled = false,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'siteUuid'),
            Fields::strings($payload, 'brandNames'),
            Fields::strings($payload, 'competitorDomains'),
            array_map(SiteMarket::fromPayload(...), Fields::objects($payload, 'markets')),
            Fields::optionalString($payload, 'updatedAt'),
            Fields::optionalBoolean($payload, 'hackerNewsEnabled') ?? false,
        );
    }
}
