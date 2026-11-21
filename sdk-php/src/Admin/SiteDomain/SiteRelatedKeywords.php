<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteRelatedKeywords is Bing keyword research's related keywords for a list's seed term over from..to. */
final readonly class SiteRelatedKeywords
{
    /** @param list<SiteRelatedKeyword> $keywords */
    public function __construct(
        public string $source,
        public string $market,
        public string $from,
        public string $to,
        public string $checkedAt,
        public array $keywords,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'source'),
            Fields::string($payload, 'market'),
            Fields::string($payload, 'from'),
            Fields::string($payload, 'to'),
            Fields::string($payload, 'checkedAt'),
            array_map(SiteRelatedKeyword::fromPayload(...), Fields::objects($payload, 'keywords')),
        );
    }
}
