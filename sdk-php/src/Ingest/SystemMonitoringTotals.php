<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class SystemMonitoringTotals
{
    public function __construct(
        public int $ingestRequestsTotal,
        public int $ingestErrorsTotal,
        public int $rawEventsLandedTotal,
        public int $rawLandingS3UploadFailuresTotal,
        public int $dataSafetyInvariantViolationsTotal,
        public int $storageUsageCollectorLastSuccessTimestamp,
        public int $claimBacklogCount,
        public int $claimBacklogOldestAgeSeconds,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'ingest_requests_total'),
            Fields::integer($payload, 'ingest_errors_total'),
            Fields::integer($payload, 'raw_events_landed_total'),
            Fields::integer($payload, 'raw_landing_s3_upload_failures_total'),
            Fields::integer($payload, 'data_safety_invariant_violations_total'),
            Fields::integer($payload, 'storage_usage_collector_last_success_timestamp'),
            Fields::integer($payload, 'claim_backlog_count'),
            Fields::integer($payload, 'claim_backlog_oldest_age_seconds'),
        );
    }
}
