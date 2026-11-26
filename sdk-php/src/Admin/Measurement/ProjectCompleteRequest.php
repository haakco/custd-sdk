<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

final readonly class ProjectCompleteRequest
{
    public function __construct(
        public string $completedAt,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'completedAt' => $this->completedAt,
        ];

        return $body;
    }
}
