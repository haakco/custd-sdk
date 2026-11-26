<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ErrorIssue;

final readonly class ErrorIssueStateRequest
{
    public function __construct(
        public string $state,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'state' => $this->state,
        ];

        return $body;
    }
}
