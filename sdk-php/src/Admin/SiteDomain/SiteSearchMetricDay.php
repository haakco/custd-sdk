<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteSearchMetricDay is one imported day of one provider's search numbers for one dimension key;
 * the total dimension has an empty key. provider is a SiteSearchProvider value.
 */
final readonly class SiteSearchMetricDay
{
    public const DIMENSION_TOTAL = 'total';
    public const DIMENSION_PAGE = 'page';
    public const DIMENSION_QUERY = 'query';
    public const DIMENSION_COUNTRY = 'country';
    public const DIMENSION_DEVICE = 'device';

    /**
     * @param SiteSearchMetricDimension::* $dimension
     */
    public function __construct(
        public string $provider,
        public string $day,
        public string $dimension,
        public string $key,
        public int $clicks,
        public int $impressions,
        public float $avgPosition,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'provider'),
            Fields::string($payload, 'day'),
            Fields::string($payload, 'dimension'),
            Fields::string($payload, 'key'),
            Fields::integer($payload, 'clicks'),
            Fields::integer($payload, 'impressions'),
            Fields::number($payload, 'avgPosition'),
        );
    }
}
