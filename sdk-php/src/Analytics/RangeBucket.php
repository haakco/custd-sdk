<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics;

use HaakCo\Custd\Fields;

/**
 * RangeBucket is one day's coverage inside a range query.
 *
 * `complete` is the server's own assessment of whether that day's source
 * answered the whole request, so it is surfaced unchanged; the SDK must not
 * substitute its own heuristic.
 */
final readonly class RangeBucket
{
    public function __construct(
        public string $date = '',
        public int $count = 0,
        public string $source = '',
        public bool $complete = false,
        public int $queryDurationMs = 0,
        public int $parquetUriCount = 0,
        public string $message = '',
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Fields::string($payload, 'date'),
            Fields::integer($payload, 'count'),
            Fields::string($payload, 'source'),
            Fields::boolean($payload, 'complete'),
            Fields::integer($payload, 'queryDurationMs'),
            Fields::optionalInteger($payload, 'parquetUriCount') ?? 0,
            Fields::optionalString($payload, 'message') ?? '',
        );
    }
}
