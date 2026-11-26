<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Offboarding;

use HaakCo\Custd\Fields;

final readonly class TenantOffboardingExclusion
{
    public function __construct(
        public string $reason,
        public string $store,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'reason'),
            Fields::string($payload, 'store'),
        );
    }
}
