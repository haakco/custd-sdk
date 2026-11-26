<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestRollupSchedulerState
{
    public function __construct(
        public int $intervalSeconds,
        public string $nextRunAt,
        public string $leaderWorkerId,
        public int $queuedRuns,
        public int $runningRuns,
        public int $failedRuns,
        public int $queuedJobs,
        public int $claimedJobs,
        public int $failedJobs,
        public string $latestRunStatus,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'intervalSeconds'),
            Fields::string($payload, 'nextRunAt'),
            Fields::string($payload, 'leaderWorkerId'),
            Fields::integer($payload, 'queuedRuns'),
            Fields::integer($payload, 'runningRuns'),
            Fields::integer($payload, 'failedRuns'),
            Fields::integer($payload, 'queuedJobs'),
            Fields::integer($payload, 'claimedJobs'),
            Fields::integer($payload, 'failedJobs'),
            Fields::string($payload, 'latestRunStatus'),
        );
    }
}
