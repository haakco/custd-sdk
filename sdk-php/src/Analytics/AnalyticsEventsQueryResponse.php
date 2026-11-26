<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics;

use HaakCo\Custd\Fields;

/**
 * AnalyticsEventsQueryResponse is one day's events: each result is one stored event row keyed by column, with the
 * sources that answered and the query timing.
 */
final readonly class AnalyticsEventsQueryResponse
{
    /**
     * @param list<array<string, mixed>> $results
     * @param list<SourceSummary> $sources
     */
    public function __construct(
        public int $count,
        public array $results,
        public array $sources,
        public TimingSummary $timing,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'count'),
            array_map(self::row(...), Fields::optionalObjects($payload, 'results') ?? []),
            array_map(SourceSummary::fromPayload(...), Fields::objects($payload, 'sources')),
            TimingSummary::fromPayload(Fields::object($payload, 'timing')),
        );
    }

    /** @return array<string, mixed> */
    private static function row(\stdClass $row): array
    {
        /** @var array<string, mixed> $columns */
        $columns = json_decode(json_encode($row, JSON_THROW_ON_ERROR), true, flags: JSON_THROW_ON_ERROR);

        return $columns;
    }
}
