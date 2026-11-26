<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteSearchRowPage is one page of a domain's imported search rows for one dimension. total
 * counts every matching row before paging; provider is null when every provider was read.
 * unavailable names providers that cannot report the dimension, which is not zero traffic.
 */
final readonly class SiteSearchRowPage
{
    /**
     * @param list<SiteSearchRow> $rows
     * @param list<SiteSearchUnavailable> $unavailable
     * @param SiteSearchProvider::*|null $provider
     * @param SiteSearchDimension::* $dimension
     */
    public function __construct(
        public string $domainUuid,
        public string $dimension,
        public int $days,
        public int $offset,
        public int $limit,
        public int $total,
        public array $rows,
        public array $unavailable,
        public ?string $provider = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $provider = Fields::optionalString($payload, 'provider');

        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::string($payload, 'dimension'),
            Fields::integer($payload, 'days'),
            Fields::integer($payload, 'offset'),
            Fields::integer($payload, 'limit'),
            Fields::integer($payload, 'total'),
            array_map(SiteSearchRow::fromPayload(...), Fields::objects($payload, 'rows')),
            array_map(SiteSearchUnavailable::fromPayload(...), Fields::objects($payload, 'unavailable')),
            $provider === null || $provider === '' ? null : $provider,
        );
    }
}
