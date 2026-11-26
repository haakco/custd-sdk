<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\User;

final readonly class AdminUserDisableRequest
{
    public function __construct(
        public string $reason,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'reason' => $this->reason,
        ];

        return $body;
    }
}
