<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class AdjustmentRequest
{
    public function __construct(
        public string $reason,
    ) {}

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'reason' => $this->reason,
        ];
    }
}
