<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteKeywordDemandSet is Bing keyword research for a keyword list, apart from the Site's own
 * numbers. state says why keywords is empty: the Site has no market, or the deployment no Bing key.
 */
final readonly class SiteKeywordDemandSet
{
    public const STATE_AVAILABLE = 'available';
    public const STATE_NO_MARKET = 'no_market';
    public const STATE_NO_BING = 'no_bing';

    /** Where the numbers come from, here and on SiteRelatedKeywords::$source. */
    public const SOURCE_BING_KEYWORD_RESEARCH = 'bing_keyword_research';

    /** @param list<SiteKeywordDemand> $keywords */
    public function __construct(
        public string $state,
        public string $source,
        public array $keywords,
        public ?string $market = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'state'),
            Fields::string($payload, 'source'),
            array_map(SiteKeywordDemand::fromPayload(...), Fields::objects($payload, 'keywords')),
            Fields::optionalString($payload, 'market'),
        );
    }
}
