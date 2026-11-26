<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Offboarding;

use HaakCo\Custd\Fields;

final readonly class OffboardingSchedule
{
    public function __construct(
        public string $effectiveAt,
        public int $gracePeriodDays,
        public string $reason,
        public string $status,
        public string $tenantSlug,
        public string $updatedAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'effectiveAt'),
            Fields::integer($payload, 'gracePeriodDays'),
            Fields::string($payload, 'reason'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'tenantSlug'),
            Fields::string($payload, 'updatedAt'),
        );
    }
}
