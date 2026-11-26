<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class ScheduledTaskRunResponse
{
    public function __construct(
        public ScheduledTaskRunResponseSummary $run,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            ScheduledTaskRunResponseSummary::fromPayload(Fields::object($payload, 'run')),
        );
    }
}
