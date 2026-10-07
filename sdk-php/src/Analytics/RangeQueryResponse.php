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

    /**
     * fromPayload decodes the shape-preserving response body: JSON objects are
     * stdClass and JSON arrays are arrays, so a required collection cannot be
     * satisfied by an object. `rows` is deep-converted back to the associative
     * column bags the public DTO documents.
     */
    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'analytics range response');
        $buckets = [];
        foreach (Fields::objects($object, 'buckets') as $bucket) {
            $buckets[] = RangeBucket::fromPayload($bucket);
        }
        $sources = [];
        foreach (Fields::objects($object, 'sources') as $source) {
            $sources[] = SourceSummary::fromPayload($source);
        }

        return new self(
            Fields::objectList($object, 'rows'),
            Fields::integer($object, 'count'),
            $buckets,
            $sources,
            TimingSummary::fromPayload(Fields::object($object, 'timing')),
        );
    }
}
