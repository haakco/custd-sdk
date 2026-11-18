<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteKeywordCluster groups a list's keywords by shared word. clicks, impressions and avgPosition are
 * null when none of its keywords was measured;
 * bingWeeklyImpressions sums Bing's latest weekly searches and is null when Bing reported none.
 */
final readonly class SiteKeywordCluster
{
    /** @param list<string> $keywords */
    public function __construct(
        public string $cluster,
        public array $keywords,
        public int $keywordCount,
        public int $measuredKeywords,
        public ?int $clicks = null,
        public ?int $impressions = null,
        public ?float $avgPosition = null,
        public ?int $bingWeeklyImpressions = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'cluster'),
            Fields::strings($payload, 'keywords'),
            Fields::integer($payload, 'keywordCount'),
            Fields::integer($payload, 'measuredKeywords'),
            Fields::optionalInteger($payload, 'clicks'),
            Fields::optionalInteger($payload, 'impressions'),
            Fields::optionalNumber($payload, 'avgPosition'),
            Fields::optionalInteger($payload, 'bingWeeklyImpressions'),
        );
    }
}
