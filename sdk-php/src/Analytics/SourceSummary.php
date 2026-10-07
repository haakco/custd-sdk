<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics;

use HaakCo\Custd\Fields;

/**
 * SourceSummary is one source's contribution to a query.
 *
 * `complete` and `fresh` are the server's own assessment of whether that source
 * answered the whole request and whether its data sat inside the freshness
 * window. They are the authority for how far a result may be trusted; the SDK
 * must not substitute its own heuristic.
 */
final readonly class SourceSummary
{
    public function __construct(
        public string $name = '',
        public int $count = 0,
        public bool $complete = false,
        public bool $fresh = false,
        public int $queryDurationMs = 0,
        public int $freshnessLagMs = 0,
        public int $parquetUriCount = 0,
        public string $message = '',
    ) {
    }

    /** @param \stdClass $payload */
    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'name'),
            Fields::integer($payload, 'count'),
            Fields::boolean($payload, 'complete'),
            Fields::boolean($payload, 'fresh'),
            Fields::integer($payload, 'queryDurationMs'),
            Fields::integer($payload, 'freshnessLagMs'),
            Fields::optionalInteger($payload, 'parquetUriCount') ?? 0,
            Fields::optionalString($payload, 'message') ?? '',
        );
    }
}
