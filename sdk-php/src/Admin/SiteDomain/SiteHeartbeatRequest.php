<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteHeartbeatRequest names a scheduled job to watch and when it must report. */
final readonly class SiteHeartbeatRequest
{
    public function __construct(
        public string $name,
        public SiteHeartbeatSchedule $schedule,
    ) {
    }

    /** @return array{name: string, schedule: array{cron: string, timezone: string, graceMinutes: int}} */
    public function serialise(): array
    {
        return ['name' => $this->name, 'schedule' => $this->schedule->serialise()];
    }
}
