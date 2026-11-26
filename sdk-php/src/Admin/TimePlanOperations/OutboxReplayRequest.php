<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

final readonly class OutboxReplayRequest
{
    public function __construct(
        public ?int $limit = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->limit !== null) {
            $body['limit'] = $this->limit;
        }

        return $body;
    }
}
