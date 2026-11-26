<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestDiagnosticsIngestState
{
    public function __construct(
        public bool $available,
        public float $requestRatePerSecond,
        public IngestStatusCounts $statusCounts,
        public float $p95LatencyMs,
        public int $activeRequests,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'available'),
            Fields::number($payload, 'requestRatePerSecond'),
            IngestStatusCounts::fromPayload(Fields::object($payload, 'statusCounts')),
            Fields::number($payload, 'p95LatencyMs'),
            Fields::integer($payload, 'activeRequests'),
        );
    }
}
