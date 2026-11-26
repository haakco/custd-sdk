<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteMaintenanceWindowRequest schedules a one-off maintenance window; the caller chooses its windowUuid. */
final readonly class SiteMaintenanceWindowRequest
{
    public function __construct(
        public string $windowUuid,
        public string $startsAt,
        public string $endsAt,
    ) {
    }

    /** @return array{windowUuid: string, startsAt: string, endsAt: string} */
    public function serialise(): array
    {
        return ['windowUuid' => $this->windowUuid, 'startsAt' => $this->startsAt, 'endsAt' => $this->endsAt];
    }
}
