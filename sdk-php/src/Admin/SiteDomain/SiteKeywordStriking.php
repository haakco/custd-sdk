<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteKeywordStriking is a listed keyword ranking just off the first page. */
final readonly class SiteKeywordStriking
{
    public function __construct(
        public string $keyword,
        public int $clicks,
        public int $impressions,
        public float $position,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'keyword'),
            Fields::integer($payload, 'clicks'),
            Fields::integer($payload, 'impressions'),
            Fields::number($payload, 'position'),
        );
    }
}
