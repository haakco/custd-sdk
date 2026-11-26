<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics;

/**
 * AnalyticsEventsQueryRequest is the named, validated request DTO for POST /api/v1/analytics/query: one UTC day
 * (YYYY-MM-DD) of the tenant's own events.
 *
 * Only the documented public fields are carried. The service also accepts an internal `anonymousId`
 * exact-subject predicate and a `countOnly` flag, but both are absent from its public JSON contract; a named DTO
 * keeps them off the wire by construction. An unset or empty log-dimension filter never narrows the query.
 */
final readonly class AnalyticsEventsQueryRequest
{
    /** Sources the single-day query may select. The range contract is narrower. */
    public const SOURCES = ["auto", "postgres", "duckdb", "rollup", "materialized"];

    /**
     * @param list<array{key: string, value: string}> $labelFilters
     */
    public function __construct(
        public string $date,
        public ?string $eventType = null,
        public ?int $limit = null,
        public ?string $source = null,
        public array $labelFilters = [],
        public ?string $severity = null,
        public ?string $service = null,
        public ?string $subClient = null,
        public ?string $resource = null,
    ) {
        if ($this->date === "") {
            throw new \InvalidArgumentException("custd: analytics query requires a date (YYYY-MM-DD)");
        }
        if (count($this->labelFilters) > Client::MAX_LABEL_FILTERS) {
            throw new \InvalidArgumentException(
                "custd: analytics query accepts at most " . Client::MAX_LABEL_FILTERS
                . " label filters, received " . count($this->labelFilters)
            );
        }
        if ($this->source !== null && !in_array($this->source, self::SOURCES, true)) {
            throw new \InvalidArgumentException("custd: analytics source must be one of " . implode(", ", self::SOURCES));
        }
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = ["date" => $this->date];
        if ($this->eventType !== null) {
            $payload["eventType"] = $this->eventType;
        }
        if ($this->limit !== null) {
            $payload["limit"] = $this->limit;
        }
        if ($this->source !== null) {
            $payload["source"] = $this->source;
        }
        if ($this->labelFilters !== []) {
            $payload["labelFilters"] = array_values($this->labelFilters);
        }

        return Client::appendLogDimensionFilters($payload, [
            "severity" => $this->severity,
            "service" => $this->service,
            "subClient" => $this->subClient,
            "resource" => $this->resource,
        ]);
    }
}
