<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SitePageFacts is what the latest audit, recheck or draft check read from one page. Text
 * fields are as written on the page and empty when absent.
 */
final readonly class SitePageFacts
{
    /**
     * @param list<SiteHreflangLink> $hreflang
     * @param list<SitePageHeading> $headings
     */
    public function __construct(
        public string $url,
        public string $observedAt,
        public int $status,
        public string $lang,
        public string $title,
        public string $description,
        public string $canonical,
        public SitePageRobots $robots,
        public SitePageOpenGraph $openGraph,
        public SitePageTwitter $twitter,
        public array $hreflang,
        public array $headings,
        public int $wordCount,
        public SitePageReadability $readability,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'url'),
            Fields::string($payload, 'observedAt'),
            Fields::integer($payload, 'status'),
            Fields::string($payload, 'lang'),
            Fields::string($payload, 'title'),
            Fields::string($payload, 'description'),
            Fields::string($payload, 'canonical'),
            SitePageRobots::fromPayload(Fields::object($payload, 'robots')),
            SitePageOpenGraph::fromPayload(Fields::object($payload, 'openGraph')),
            SitePageTwitter::fromPayload(Fields::object($payload, 'twitter')),
            array_map(SiteHreflangLink::fromPayload(...), Fields::objects($payload, 'hreflang')),
            array_map(SitePageHeading::fromPayload(...), Fields::objects($payload, 'headings')),
            Fields::integer($payload, 'wordCount'),
            SitePageReadability::fromPayload(Fields::object($payload, 'readability')),
        );
    }
}
