<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteRelatedKeyword is one related keyword and its Bing searches, exact and containing it. */
final readonly class SiteRelatedKeyword
{
    public function __construct(
        public string $keyword,
        public int $impressions,
        public int $broadImpressions,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'keyword'),
            Fields::integer($payload, 'impressions'),
            Fields::integer($payload, 'broadImpressions'),
        );
    }
}
