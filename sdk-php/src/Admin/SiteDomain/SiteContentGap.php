<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteContentGap is the topics competitors cover that the Site's own pages and search queries do not.
 * ownCoverage is COVERAGE_UNAVAILABLE when the Site's own pages could not be read; partial marks a
 * competitor inventory that is not complete.
 */
final readonly class SiteContentGap
{
    public const COVERAGE_AVAILABLE = 'available';
    public const COVERAGE_UNAVAILABLE = 'unavailable';

    /**
     * @param list<SiteGapCompetitor> $competitors
     * @param list<SiteGapTopic> $topics
     * @param SiteContentGapCoverage::* $ownCoverage
     */
    public function __construct(
        public string $siteUuid,
        public string $ownCoverage,
        public int $ownPages,
        public int $ownQueries,
        public bool $partial,
        public array $competitors,
        public array $topics,
        public ?string $seed = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'siteUuid'),
            Fields::string($payload, 'ownCoverage'),
            Fields::integer($payload, 'ownPages'),
            Fields::integer($payload, 'ownQueries'),
            Fields::boolean($payload, 'partial'),
            array_map(SiteGapCompetitor::fromPayload(...), Fields::objects($payload, 'competitors')),
            array_map(SiteGapTopic::fromPayload(...), Fields::objects($payload, 'topics')),
            Fields::optionalString($payload, 'seed'),
        );
    }
}
