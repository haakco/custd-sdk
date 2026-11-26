<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class ScheduledTaskSummary
{
    public function __construct(
        public string $description,
        public string $displayName,
        public string $lockBackend,
        public string $overlapPolicy,
        public string $ownerService,
        public string $scheduleExpression,
        public string $scheduleKind,
        public string $taskName,
        public string $timezone,
        public int $failedRuns,
        public int $queuedRuns,
        public int $runningRuns,
        public int $timeoutSeconds,
        public bool $enabled,
        public bool $forceRunsAllowed,
        public bool $manualRunsAllowed,
        public ?string $nextRunAt = null,
        public ?ScheduledTaskRun $latestRun = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $latestRun = Fields::optionalObject($payload, 'latestRun');

        return new self(
            Fields::string($payload, 'description'),
            Fields::string($payload, 'displayName'),
            Fields::string($payload, 'lockBackend'),
            Fields::string($payload, 'overlapPolicy'),
            Fields::string($payload, 'ownerService'),
            Fields::string($payload, 'scheduleExpression'),
            Fields::string($payload, 'scheduleKind'),
            Fields::string($payload, 'taskName'),
            Fields::string($payload, 'timezone'),
            Fields::integer($payload, 'failedRuns'),
            Fields::integer($payload, 'queuedRuns'),
            Fields::integer($payload, 'runningRuns'),
            Fields::integer($payload, 'timeoutSeconds'),
            Fields::boolean($payload, 'enabled'),
            Fields::boolean($payload, 'forceRunsAllowed'),
            Fields::boolean($payload, 'manualRunsAllowed'),
            Fields::optionalString($payload, 'nextRunAt'),
            $latestRun === null ? null : ScheduledTaskRun::fromPayload($latestRun),
        );
    }
}
