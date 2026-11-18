<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SitePageFacts is what the latest audit, recheck or draft check read from one page. Text
 * fields are as written on the page and empty when absent. shareImage is the og:image a fix would
 * name (the largest declared image, else the first unsized one; never fetched), empty when there
 * is none or the server predates it. faqSchema is FAQPage JSON-LD from the page's question
 * headings, null when it asks none; Google shows no FAQ rich results since 7 May 2026.
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
        public string $shareImage = '',
        public ?SiteGeneratedFix $faqSchema = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $faqSchema = Fields::optionalObject($payload, 'faqSchema');

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
            Fields::optionalString($payload, 'shareImage') ?? '',
            $faqSchema === null ? null : SiteGeneratedFix::fromPayload($faqSchema),
        );
    }
}
