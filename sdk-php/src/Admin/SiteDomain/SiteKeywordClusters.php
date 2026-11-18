<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteKeywordClusters is one keyword list grouped into clusters with the search numbers of the last
 * metricsDays days from metricsSource, and the list's Bing keyword research in demand (null from an
 * older server).
 */
final readonly class SiteKeywordClusters
{
    /**
     * @param list<SiteKeywordCluster> $clusters
     * @param list<SiteKeywordStriking> $strikingDistance
     */
    public function __construct(
        public string $siteUuid,
        public string $name,
        public string $metricsSource,
        public int $metricsDays,
        public int $totalKeywords,
        public array $clusters,
        public array $strikingDistance,
        public ?SiteKeywordDemandSet $demand = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $demand = Fields::optionalObject($payload, 'demand');

        return new self(
            Fields::string($payload, 'siteUuid'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'metricsSource'),
            Fields::integer($payload, 'metricsDays'),
            Fields::integer($payload, 'totalKeywords'),
            array_map(SiteKeywordCluster::fromPayload(...), Fields::objects($payload, 'clusters')),
            array_map(SiteKeywordStriking::fromPayload(...), Fields::objects($payload, 'strikingDistance')),
            $demand === null ? null : SiteKeywordDemandSet::fromPayload($demand),
        );
    }
}
