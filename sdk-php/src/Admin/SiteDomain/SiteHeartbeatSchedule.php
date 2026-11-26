<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteHeartbeatSchedule is when a job is expected to report: a cron in a timezone, plus grace minutes. */
final readonly class SiteHeartbeatSchedule
{
    public function __construct(
        public string $cron,
        public string $timezone,
        public int $graceMinutes,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'cron'),
            Fields::string($payload, 'timezone'),
            Fields::integer($payload, 'graceMinutes'),
        );
    }

    /** @return array{cron: string, timezone: string, graceMinutes: int} */
    public function serialise(): array
    {
        return ['cron' => $this->cron, 'timezone' => $this->timezone, 'graceMinutes' => $this->graceMinutes];
    }
}
