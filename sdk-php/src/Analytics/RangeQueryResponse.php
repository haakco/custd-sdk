<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics;

use HaakCo\Custd\Fields;

/**
 * RangeQueryResponse is the typed result of POST /api/v1/analytics/query-range.
 *
 * `rows` stays a list of decoded column bags: the service serialises whatever
 * the segment writer produced, so new columns must appear without an SDK change.
 * Every named field is typed.
 */
final readonly class RangeQueryResponse
{
    /**
     * @param list<array<string, mixed>> $rows
     * @param list<RangeBucket> $buckets
     * @param list<SourceSummary> $sources
     */
    public function __construct(
        public array $rows = [],
        public int $count = 0,
        public array $buckets = [],
        public array $sources = [],
        public TimingSummary $timing = new TimingSummary(),
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        $buckets = [];
        foreach (Fields::objects($payload, 'buckets') as $bucket) {
            $buckets[] = RangeBucket::fromPayload($bucket);
        }
        $sources = [];
        foreach (Fields::objects($payload, 'sources') as $source) {
            $sources[] = SourceSummary::fromPayload($source);
        }

        return new self(
            Fields::objects($payload, 'rows'),
            Fields::integer($payload, 'count'),
            $buckets,
            $sources,
            TimingSummary::fromPayload(self::timingPayload($payload)),
        );
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private static function timingPayload(array $payload): array
    {
        $timing = $payload['timing'] ?? null;
        if ($timing === null) {
            throw new \UnexpectedValueException('custd: analytics range response timing is required');
        }
        if (!is_array($timing) || array_is_list($timing)) {
            throw new \UnexpectedValueException('custd: analytics range response timing must be an object');
        }
        /** @var array<string, mixed> $timing */
        return $timing;
    }
}
