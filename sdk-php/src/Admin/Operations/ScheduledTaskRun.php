<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

/**
 * ScheduledTaskRun is one run of a scheduled task; a work counter is present only when the task reported it.
 */
final readonly class ScheduledTaskRun
{
    public function __construct(
        public int $durationMs,
        public int $itemsCompleted,
        public int $itemsFailed,
        public int $itemsTotal,
        public string $runUuid,
        public string $scheduledFor,
        public string $status,
        public string $taskName,
        public string $trigger,
        public ?int $jobsCompacted = null,
        public ?int $rowsCompacted = null,
        public ?int $bytesCompacted = null,
        public ?int $sourcesRetired = null,
        public ?int $bytesRetired = null,
        public ?int $regionalTrendReads = null,
        public ?int $regionalTrendItems = null,
        public ?int $regionalTrendFailures = null,
        public ?int $hackerNewsReads = null,
        public ?int $hackerNewsItems = null,
        public ?int $hackerNewsFailures = null,
        public ?string $completedAt = null,
        public ?string $failureReason = null,
        public ?string $startedAt = null,
        public ?string $workerId = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'durationMs'),
            Fields::integer($payload, 'itemsCompleted'),
            Fields::integer($payload, 'itemsFailed'),
            Fields::integer($payload, 'itemsTotal'),
            Fields::string($payload, 'runUuid'),
            Fields::string($payload, 'scheduledFor'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'taskName'),
            Fields::string($payload, 'trigger'),
            Fields::optionalInteger($payload, 'jobsCompacted'),
            Fields::optionalInteger($payload, 'rowsCompacted'),
            Fields::optionalInteger($payload, 'bytesCompacted'),
            Fields::optionalInteger($payload, 'sourcesRetired'),
            Fields::optionalInteger($payload, 'bytesRetired'),
            Fields::optionalInteger($payload, 'regionalTrendReads'),
            Fields::optionalInteger($payload, 'regionalTrendItems'),
            Fields::optionalInteger($payload, 'regionalTrendFailures'),
            Fields::optionalInteger($payload, 'hackerNewsReads'),
            Fields::optionalInteger($payload, 'hackerNewsItems'),
            Fields::optionalInteger($payload, 'hackerNewsFailures'),
            Fields::optionalString($payload, 'completedAt'),
            Fields::optionalString($payload, 'failureReason'),
            Fields::optionalString($payload, 'startedAt'),
            Fields::optionalString($payload, 'workerId'),
        );
    }
}
