<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class ScheduledTaskListViewResponse
{
    /**
     * @param list<ScheduledTaskListItem> $tasks
     */
    public function __construct(
        public array $tasks,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(ScheduledTaskListItem::fromPayload(...), Fields::objects($payload, 'tasks')),
        );
    }
}
