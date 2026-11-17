<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteTraffic is a domain's access-log traffic over the UTC days from..to (YYYY-MM-DD). totals is null when
 * no hour of the range was read.
 */
final readonly class SiteTraffic
{
    /**
     * @param list<SiteTrafficDay> $days
     * @param list<SiteTrafficCount> $statusClasses
     * @param list<SiteTrafficCount> $notFoundPaths
     * @param list<SiteTrafficSlowPath> $slowPaths
     * @param list<SiteTrafficCount> $countries
     * @param list<SiteTrafficReferrerClass> $referrerClasses
     * @param list<SiteTrafficReferrer> $referrers
     * @param list<SiteTrafficCrawler> $crawlers
     */
    public function __construct(
        public string $domainUuid,
        public string $from,
        public string $to,
        public string $generatedAt,
        public array $days,
        public array $statusClasses,
        public array $notFoundPaths,
        public array $slowPaths,
        public array $countries,
        public array $referrerClasses,
        public array $referrers,
        public array $crawlers,
        public SiteTrafficCoverage $coverage,
        public ?SiteTrafficTotals $totals = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $totals = Fields::optionalObject($payload, 'totals');

        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::string($payload, 'from'),
            Fields::string($payload, 'to'),
            Fields::string($payload, 'generatedAt'),
            array_map(SiteTrafficDay::fromPayload(...), Fields::objects($payload, 'days')),
            array_map(SiteTrafficCount::fromPayload(...), Fields::objects($payload, 'statusClasses')),
            array_map(SiteTrafficCount::fromPayload(...), Fields::objects($payload, 'notFoundPaths')),
            array_map(SiteTrafficSlowPath::fromPayload(...), Fields::objects($payload, 'slowPaths')),
            array_map(SiteTrafficCount::fromPayload(...), Fields::objects($payload, 'countries')),
            array_map(SiteTrafficReferrerClass::fromPayload(...), Fields::objects($payload, 'referrerClasses')),
            array_map(SiteTrafficReferrer::fromPayload(...), Fields::objects($payload, 'referrers')),
            array_map(SiteTrafficCrawler::fromPayload(...), Fields::objects($payload, 'crawlers')),
            SiteTrafficCoverage::fromPayload(Fields::object($payload, 'coverage')),
            $totals === null ? null : SiteTrafficTotals::fromPayload($totals),
        );
    }
}
