<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

/**
 * ScheduledTaskDetailResponse is one scheduled task with its recent runs.
 */
final readonly class ScheduledTaskDetailResponse
{
    /**
     * @param list<ScheduledTaskRun> $runs
     */
    public function __construct(
        public ScheduledTaskSummary $task,
        public array $runs,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            ScheduledTaskSummary::fromPayload(Fields::object($payload, 'task')),
            array_map(ScheduledTaskRun::fromPayload(...), Fields::objects($payload, 'runs')),
        );
    }
}
