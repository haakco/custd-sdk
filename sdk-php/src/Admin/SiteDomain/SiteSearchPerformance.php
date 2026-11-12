<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteSearchPerformance is a domain's imported search numbers over the last $days days. */
final readonly class SiteSearchPerformance
{
    /**
     * @param list<SiteSearchConnection> $connections
     * @param list<SiteSearchSource> $sources
     * @param list<SiteSearchRow> $topPages
     * @param list<SiteSearchRow> $topQueries
     */
    public function __construct(
        public string $domainUuid,
        public int $days,
        public array $connections = [],
        public array $sources = [],
        public array $topPages = [],
        public array $topQueries = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::integer($payload, 'days'),
            array_map(SiteSearchConnection::fromPayload(...), Fields::objects($payload, 'connections')),
            array_map(SiteSearchSource::fromPayload(...), Fields::objects($payload, 'sources')),
            self::rows($payload, 'topPages'),
            self::rows($payload, 'topQueries'),
        );
    }

    /** @return list<SiteSearchRow> */
    private static function rows(\stdClass $payload, string $key): array
    {
        return array_map(SiteSearchRow::fromPayload(...), Fields::objects($payload, $key));
    }
}
