<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * IngestMonitoringSummary is the tenant's ingest counters, in their snake_case wire spelling.
 */
final readonly class IngestMonitoringSummary
{
    public function __construct(
        public int $ingestRequestsTotal,
        public int $ingestErrorsTotal,
        public int $eventSegmentsVerifiedRowsTotal,
        public int $rawEventsLandedTotal,
        public int $rawStorageS3Total,
        public int $rawLandingS3UploadFailuresTotal,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'ingest_requests_total'),
            Fields::integer($payload, 'ingest_errors_total'),
            Fields::integer($payload, 'event_segments_verified_rows_total'),
            Fields::integer($payload, 'raw_events_landed_total'),
            Fields::integer($payload, 'raw_storage_s3_total'),
            Fields::integer($payload, 'raw_landing_s3_upload_failures_total'),
        );
    }
}
