<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteTopicTrend is the monthly Wikipedia views of one brand or seed term. source is a SOURCE_* value
 * and status a STATUS_* value; article is empty unless found.
 */
final readonly class SiteTopicTrend
{
    public const SOURCE_BRAND = 'brand';
    public const SOURCE_SEED = 'seed';
    public const STATUS_PENDING = 'pending';
    public const STATUS_FOUND = 'found';
    public const STATUS_NO_ARTICLE = 'no_article';
    public const STATUS_FAILED = 'failed';

    /** @param list<SiteTrendMonth> $months */
    public function __construct(
        public string $term,
        public string $source,
        public string $project,
        public string $article,
        public string $status,
        public array $months,
        public ?string $lastFailure = null,
        public ?string $checkedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'term'),
            Fields::string($payload, 'source'),
            Fields::string($payload, 'project'),
            Fields::string($payload, 'article'),
            Fields::string($payload, 'status'),
            array_map(SiteTrendMonth::fromPayload(...), Fields::objects($payload, 'months')),
            Fields::optionalString($payload, 'lastFailure'),
            Fields::optionalString($payload, 'checkedAt'),
        );
    }
}
