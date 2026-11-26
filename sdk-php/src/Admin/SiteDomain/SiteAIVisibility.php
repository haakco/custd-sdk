<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteAIVisibility is how AI crawlers read a domain and how often AI assistants refer visitors to it,
 * over the UTC days from..to. answerSample is the latest provider sample, independent of the range.
 */
final readonly class SiteAIVisibility
{
    /**
     * @param list<SiteTrafficCrawler> $crawlers
     * @param list<SiteTrafficCount> $assistants
     * @param list<SiteAIPage> $pages
     */
    public function __construct(
        public string $domainUuid,
        public string $siteUuid,
        public string $from,
        public string $to,
        public string $generatedAt,
        public array $crawlers,
        public array $assistants,
        public array $pages,
        public SiteTrafficCoverage $coverage,
        public ?SiteAIAnswerSample $answerSample = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $answerSample = Fields::optionalObject($payload, 'answerSample');

        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::string($payload, 'siteUuid'),
            Fields::string($payload, 'from'),
            Fields::string($payload, 'to'),
            Fields::string($payload, 'generatedAt'),
            array_map(SiteTrafficCrawler::fromPayload(...), Fields::objects($payload, 'crawlers')),
            array_map(SiteTrafficCount::fromPayload(...), Fields::objects($payload, 'assistants')),
            array_map(SiteAIPage::fromPayload(...), Fields::objects($payload, 'pages')),
            SiteTrafficCoverage::fromPayload(Fields::object($payload, 'coverage')),
            $answerSample === null ? null : SiteAIAnswerSample::fromPayload($answerSample),
        );
    }
}
