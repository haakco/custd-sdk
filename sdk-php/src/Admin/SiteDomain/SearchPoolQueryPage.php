<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SearchPoolQueryPage is the pooled queries over from..to (YYYY-MM-DD) as computed at computedAt;
 * all three are null before the first rollup.
 */
final readonly class SearchPoolQueryPage
{
    /** The queries read when no limit is asked for. */
    public const DEFAULT_LIMIT = 50;
    /** The most queries one read returns. */
    public const MAX_LIMIT = 200;
    /** The longest search text accepted. */
    public const MAX_SEARCH_LENGTH = 100;

    /** @param list<SearchPoolQuery> $queries */
    public function __construct(
        public array $queries,
        public ?string $from = null,
        public ?string $to = null,
        public ?string $computedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(SearchPoolQuery::fromPayload(...), Fields::objects($payload, 'queries')),
            Fields::optionalString($payload, 'from'),
            Fields::optionalString($payload, 'to'),
            Fields::optionalString($payload, 'computedAt'),
        );
    }
}
