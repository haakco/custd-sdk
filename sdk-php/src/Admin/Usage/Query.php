<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Usage;

use HaakCo\Custd\Admin\UsageClient;

/**
 * Query is the named, validated request DTO for GET /api/v1/admin/usage/me.
 *
 * It narrows and bounds the usage window. Omitting `start` and `end` uses the
 * service default, the trailing 30 days ending now; omitting `limit` uses
 * {@see UsageClient::DEFAULT_LIMIT}. Building an invalid window throws here so
 * it never costs a round trip.
 */
final readonly class Query
{
    /**
     * RFC3339 timestamps only, matching the service's time.Parse(time.RFC3339):
     * seconds and an explicit Z or numeric offset.
     */
    private const RFC3339_PATTERN =
        '/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/';

    public function __construct(
        public ?string $meterSlug = null,
        public ?string $start = null,
        public ?string $end = null,
        public ?int $limit = null,
    ) {
        if ($limit !== null && ($limit < 1 || $limit > UsageClient::MAX_LIMIT)) {
            throw new \InvalidArgumentException("custd: usage limit must be between 1 and " . UsageClient::MAX_LIMIT);
        }
        $startInstant = $start === null ? null : self::parseInstant($start, "start");
        $endInstant = $end === null ? null : self::parseInstant($end, "end");
        if ($startInstant !== null && $endInstant !== null && $startInstant >= $endInstant) {
            throw new \InvalidArgumentException("custd: usage start must be before end");
        }
    }

    /** serialise returns the wire query string, including the leading `?` when non-empty. */
    public function serialise(): string
    {
        $params = [];
        if ($this->end !== null) {
            $params["end"] = $this->end;
        }
        if ($this->limit !== null) {
            $params["limit"] = (string) $this->limit;
        }
        if ($this->meterSlug !== null) {
            $params["meter"] = $this->meterSlug;
        }
        if ($this->start !== null) {
            $params["start"] = $this->start;
        }

        return $params === [] ? "" : "?" . http_build_query($params);
    }

    private static function parseInstant(string $value, string $field): \DateTimeImmutable
    {
        if (preg_match(self::RFC3339_PATTERN, $value, $matches) !== 1) {
            throw new \InvalidArgumentException("custd: usage {$field} must be an RFC3339 timestamp");
        }
        // The regex admits any two-digit day, so reject a normalizable date such
        // as February 30 before it becomes a valid but unintended instant.
        if (!checkdate((int) $matches[2], (int) $matches[3], (int) $matches[1])) {
            throw new \InvalidArgumentException("custd: usage {$field} must be an RFC3339 timestamp");
        }
        // \DateTimeImmutable normalizes an out-of-range clock time (hour 24 rolls
        // to the next day, second 60 to the next minute), so bound hours, minutes,
        // and seconds explicitly instead of trusting the parsed instant.
        $hour = (int) $matches[4];
        $minute = (int) $matches[5];
        $second = (int) $matches[6];
        if ($hour > 23 || $minute > 59 || $second > 59) {
            throw new \InvalidArgumentException("custd: usage {$field} must be an RFC3339 timestamp");
        }

        return new \DateTimeImmutable($value);
    }
}
