<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteProjectContextRequest replaces a Site's project context: up to 5 brand names, 10
 * competitor DNS names (such as competitor.example) and 10 markets. Omit the Hacker News setting to keep the saved choice.
 */
final readonly class SiteProjectContextRequest
{
    /**
     * @param list<string> $brandNames
     * @param list<string> $competitorDomains
     * @param list<SiteMarket> $markets
     */
    public function __construct(
        public array $brandNames = [],
        public array $competitorDomains = [],
        public array $markets = [],
        public ?bool $hackerNewsEnabled = null,
    ) {
    }

    /**
     * @return array{brandNames: list<string>, competitorDomains: list<string>,
     *     markets: list<array{country: string, language: string}>, hackerNewsEnabled?: bool}
     */
    public function serialise(): array
    {
        return [
            'brandNames' => $this->brandNames,
            'competitorDomains' => $this->competitorDomains,
            'markets' => array_map(static fn (SiteMarket $market): array => $market->serialise(), $this->markets),
        ] + ($this->hackerNewsEnabled === null ? [] : ['hackerNewsEnabled' => $this->hackerNewsEnabled]);
    }
}
