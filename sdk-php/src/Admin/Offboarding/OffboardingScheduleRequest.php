<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Offboarding;

final readonly class OffboardingScheduleRequest
{
    public function __construct(
        public string $effectiveAt,
        public int $gracePeriodDays,
        public string $reason,
        public string $tenantSlug,
        public ?string $status = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'effectiveAt' => $this->effectiveAt,
            'gracePeriodDays' => $this->gracePeriodDays,
            'reason' => $this->reason,
            'tenantSlug' => $this->tenantSlug,
        ];
        if ($this->status !== null) {
            $body['status'] = $this->status;
        }

        return $body;
    }
}
