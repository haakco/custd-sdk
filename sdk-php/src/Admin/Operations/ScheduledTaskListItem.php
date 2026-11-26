<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class ScheduledTaskListItem
{
    public function __construct(
        public string $description,
        public string $displayName,
        public bool $enabled,
        public int $failedRuns,
        public bool $forceRunsAllowed,
        public string $lockBackend,
        public bool $manualRunsAllowed,
        public string $overlapPolicy,
        public string $ownerService,
        public int $queuedRuns,
        public int $runningRuns,
        public string $scheduleExpression,
        public string $scheduleKind,
        public string $taskName,
        public int $timeoutSeconds,
        public string $timezone,
        public ?ScheduledTaskListRunSummary $latestRun = null,
        public ?string $nextRunAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $latestRun = Fields::optionalObject($payload, 'latestRun');

        return new self(
            Fields::string($payload, 'description'),
            Fields::string($payload, 'displayName'),
            Fields::boolean($payload, 'enabled'),
            Fields::integer($payload, 'failedRuns'),
            Fields::boolean($payload, 'forceRunsAllowed'),
            Fields::string($payload, 'lockBackend'),
            Fields::boolean($payload, 'manualRunsAllowed'),
            Fields::string($payload, 'overlapPolicy'),
            Fields::string($payload, 'ownerService'),
            Fields::integer($payload, 'queuedRuns'),
            Fields::integer($payload, 'runningRuns'),
            Fields::string($payload, 'scheduleExpression'),
            Fields::string($payload, 'scheduleKind'),
            Fields::string($payload, 'taskName'),
            Fields::integer($payload, 'timeoutSeconds'),
            Fields::string($payload, 'timezone'),
            $latestRun === null ? null : ScheduledTaskListRunSummary::fromPayload($latestRun),
            Fields::optionalString($payload, 'nextRunAt'),
        );
    }
}
