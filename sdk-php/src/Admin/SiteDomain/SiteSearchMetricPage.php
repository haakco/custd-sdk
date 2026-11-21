<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteSearchMetricPage is one page of a domain's exported daily search metric rows; total counts them all. */
final readonly class SiteSearchMetricPage
{
    /** The most rows one page reads. */
    public const MAX_LIMIT = 10000;

    /** @param list<SiteSearchMetricDay> $rows */
    public function __construct(
        public string $domainUuid,
        public int $offset,
        public int $limit,
        public int $total,
        public array $rows,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::integer($payload, 'offset'),
            Fields::integer($payload, 'limit'),
            Fields::integer($payload, 'total'),
            array_map(SiteSearchMetricDay::fromPayload(...), Fields::objects($payload, 'rows')),
        );
    }
}
