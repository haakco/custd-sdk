<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Offboarding;

use HaakCo\Custd\Fields;

final readonly class TenantReceiptWaiver
{
    public function __construct(
        public string $role,
        public string $timestamp,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'role'),
            Fields::string($payload, 'timestamp'),
        );
    }
}
