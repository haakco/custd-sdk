<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Offboarding;

final readonly class OffboardingCancelRequest
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
