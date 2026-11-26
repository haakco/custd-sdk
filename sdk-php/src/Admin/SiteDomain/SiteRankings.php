<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteRankings is a domain's tracked keywords over from..to (YYYY-MM-DD). source is the Search
 * Console connection's state (a SiteRankingsSource value); sourceFailure says why a failing one fails. pool is
 * the tenant's shared search pool access (a SearchPoolAccess value), null from an older server.
 */
final readonly class SiteRankings
{
    /** How many keywords a Site may track. */
    public const MAX_KEYWORDS = 50;
    /** The days read when none are asked for. */
    public const DEFAULT_DAYS = 28;
    /** The most days one read covers. */
    public const MAX_DAYS = 90;

    /**
     * @param list<SiteTrackedKeyword> $keywords
     * @param SearchPoolAccess::*|null $pool
     * @param SiteRankingsSource::* $source
     */
    public function __construct(
        public string $source,
        public string $from,
        public string $to,
        public int $maxKeywords,
        public array $keywords,
        public ?string $sourceFailure = null,
        public ?string $pool = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'source'),
            Fields::string($payload, 'from'),
            Fields::string($payload, 'to'),
            Fields::integer($payload, 'maxKeywords'),
            array_map(SiteTrackedKeyword::fromPayload(...), Fields::objects($payload, 'keywords')),
            Fields::optionalString($payload, 'sourceFailure'),
            Fields::optionalString($payload, 'pool'),
        );
    }
}
