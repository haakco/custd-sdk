<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics;

/**
 * RangeQueryRequest is the named, validated request DTO for
 * POST /api/v1/analytics/query-range.
 *
 * Only the documented public fields are carried. The service also accepts an
 * internal `anonymousId` exact-subject predicate and a `countOnly` flag, but
 * both are absent from its public JSON contract; a named DTO keeps them off the
 * wire by construction. The range source is restricted to omitted/empty,
 * `auto`, or `duckdb`; a present empty string is accepted as the default and
 * normalized to an omitted field. The single-day query's retired `postgres`,
 * `rollup`, and `materialized` sources are not part of the range contract.
 */
final readonly class RangeQueryRequest
{
    /** The sources the range query accepts. */
    private const RANGE_SOURCES = ["auto", "duckdb"];

    /**
     * @param list<array{key: string, value: string}> $labelFilters
     */
    public function __construct(
        public string $from,
        public string $to,
        public ?string $eventType = null,
        public ?int $limit = null,
        public ?string $source = null,
        public ?string $groupBy = null,
        public array $labelFilters = [],
    ) {
        $startDay = self::parseUtcDay($this->from, "from");
        $endDay = self::parseUtcDay($this->to, "to");
        if ($endDay < $startDay) {
            throw new \InvalidArgumentException("custd: analytics range query to must not be before from");
        }
        $days = (int) $startDay->diff($endDay)->days + 1;
        if ($days > Client::MAX_RANGE_DAYS) {
            throw new \InvalidArgumentException(
                "custd: analytics range query spans {$days} days, the maximum is " . Client::MAX_RANGE_DAYS
            );
        }
        if ($this->groupBy !== null && $this->groupBy !== Client::RANGE_GROUP_BY) {
            throw new \InvalidArgumentException(
                "custd: analytics range query groupBy must be \"" . Client::RANGE_GROUP_BY . "\""
            );
        }
        if ($this->source !== null && $this->source !== "" && !in_array($this->source, self::RANGE_SOURCES, true)) {
            throw new \InvalidArgumentException(
                "custd: analytics range query source must be one of " . implode(", ", self::RANGE_SOURCES)
            );
        }
        if (count($this->labelFilters) > Client::MAX_LABEL_FILTERS) {
            throw new \InvalidArgumentException(
                "custd: analytics range query accepts at most " . Client::MAX_LABEL_FILTERS
                . " label filters, received " . count($this->labelFilters)
            );
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function serialise(): array
    {
        $payload = ["from" => $this->from, "to" => $this->to];
        if ($this->eventType !== null) {
            $payload["eventType"] = $this->eventType;
        }
        if ($this->limit !== null) {
            $payload["limit"] = $this->limit;
        }
        if ($this->source !== null && $this->source !== "") {
            $payload["source"] = $this->source;
        }
        if ($this->groupBy !== null) {
            $payload["groupBy"] = $this->groupBy;
        }
        if ($this->labelFilters !== []) {
            $payload["labelFilters"] = array_values($this->labelFilters);
        }

        return $payload;
    }

    private static function parseUtcDay(string $value, string $field): \DateTimeImmutable
    {
        $parsed = \DateTimeImmutable::createFromFormat("!Y-m-d", $value, new \DateTimeZone("UTC"));
        if ($parsed === false || $parsed->format("Y-m-d") !== $value) {
            throw new \InvalidArgumentException("custd: analytics range query {$field} must be YYYY-MM-DD");
        }

        return $parsed;
    }
}
