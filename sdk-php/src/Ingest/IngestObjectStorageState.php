<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestObjectStorageState
{
    public function __construct(
        public bool $available,
        public int $acceptedRawLandingPending,
        public int $acceptedRawLandingOldestPendingAgeSeconds,
        public int $acceptedRawLandingWritingLeases,
        public int $acceptedRawLandingFailedObjects,
        public int $acceptedRawLandingConsolidationEligibleWindows,
        public int $acceptedRawLandingConsolidationSourceObjects,
        public int $acceptedRawLandingConsolidationEstimatedObjectReduction,
        public int $acceptedRawLandingS3UploadFailuresTotal,
        public float $acceptedRawLandingObjectGroupsPerSecond,
        public float $acceptedRawLandingUploadDurationMs,
        public float $acceptedRawLandingVerificationDurationMs,
        public float $acceptedRawLandingDBMetadataDurationMs,
        public float $acceptedRawLandingObjectGroupSizeAverage,
        public float $acceptedRawLandingObjectGroupSizeMax,
        public float $acceptedRawLandingObjectLimiterSaturation,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'available'),
            Fields::integer($payload, 'acceptedRawLandingPending'),
            Fields::integer($payload, 'acceptedRawLandingOldestPendingAgeSeconds'),
            Fields::integer($payload, 'acceptedRawLandingWritingLeases'),
            Fields::integer($payload, 'acceptedRawLandingFailedObjects'),
            Fields::integer($payload, 'acceptedRawLandingConsolidationEligibleWindows'),
            Fields::integer($payload, 'acceptedRawLandingConsolidationSourceObjects'),
            Fields::integer($payload, 'acceptedRawLandingConsolidationEstimatedObjectReduction'),
            Fields::integer($payload, 'acceptedRawLandingS3UploadFailuresTotal'),
            Fields::number($payload, 'acceptedRawLandingObjectGroupsPerSecond'),
            Fields::number($payload, 'acceptedRawLandingUploadDurationMs'),
            Fields::number($payload, 'acceptedRawLandingVerificationDurationMs'),
            Fields::number($payload, 'acceptedRawLandingDBMetadataDurationMs'),
            Fields::number($payload, 'acceptedRawLandingObjectGroupSizeAverage'),
            Fields::number($payload, 'acceptedRawLandingObjectGroupSizeMax'),
            Fields::number($payload, 'acceptedRawLandingObjectLimiterSaturation'),
        );
    }
}
