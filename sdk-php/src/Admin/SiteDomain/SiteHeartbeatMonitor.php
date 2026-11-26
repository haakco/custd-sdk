<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteHeartbeatMonitor watches one scheduled job on a domain. latest is null until the job first reports. */
final readonly class SiteHeartbeatMonitor
{
    /**
     * @param SiteHeartbeatStatus::* $status
     */
    public function __construct(
        public string $monitorUuid,
        public string $name,
        public SiteHeartbeatSchedule $schedule,
        public string $startedAt,
        public string $nextExpectedAt,
        public string $status,
        public ?SiteHeartbeatReceipt $latest = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $latest = Fields::optionalObject($payload, 'latest');

        return new self(
            Fields::string($payload, 'monitorUuid'),
            Fields::string($payload, 'name'),
            SiteHeartbeatSchedule::fromPayload(Fields::object($payload, 'schedule')),
            Fields::string($payload, 'startedAt'),
            Fields::string($payload, 'nextExpectedAt'),
            Fields::string($payload, 'status'),
            $latest === null ? null : SiteHeartbeatReceipt::fromPayload($latest),
        );
    }
}
