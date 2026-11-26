<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class ScheduledTaskListRunSummary
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
            Fields::optionalString($payload, 'completedAt'),
            Fields::optionalString($payload, 'failureReason'),
            Fields::optionalString($payload, 'startedAt'),
            Fields::optionalString($payload, 'workerId'),
        );
    }
}
