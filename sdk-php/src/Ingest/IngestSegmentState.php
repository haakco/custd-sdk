<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestSegmentState
{
    public function __construct(
        public bool $available,
        public int $pending,
        public int $verified,
        public int $failed,
        public int $oldestPendingAgeSeconds,
        public int $compactedVerified,
        public int $compactedFailed,
        public int $rollupVerified,
        public int $rollupFailed,
        public int $compactionEligibleSources,
        public int $compactionEstimatedObjectReduction,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'available'),
            Fields::integer($payload, 'pending'),
            Fields::integer($payload, 'verified'),
            Fields::integer($payload, 'failed'),
            Fields::integer($payload, 'oldestPendingAgeSeconds'),
            Fields::integer($payload, 'compactedVerified'),
            Fields::integer($payload, 'compactedFailed'),
            Fields::integer($payload, 'rollupVerified'),
            Fields::integer($payload, 'rollupFailed'),
            Fields::integer($payload, 'compactionEligibleSources'),
            Fields::integer($payload, 'compactionEstimatedObjectReduction'),
        );
    }
}
