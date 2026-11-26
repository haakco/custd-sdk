<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

final readonly class ScheduledTaskRunRequest
{
    public function __construct(
        public bool $force,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'force' => $this->force,
        ];

        return $body;
    }
}
