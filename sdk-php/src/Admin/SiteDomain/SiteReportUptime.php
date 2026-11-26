<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteReportUptime
{
    /**
     * @param list<SiteUptimeDay> $days
     * @param SiteUptimeStatus::* $status
     */
    public function __construct(
        public string $status,
        public SiteUptimeWindows $windows,
        public array $days,
        public ?int $responseMs = null,
        public ?string $downSince = null,
        public ?string $monitoredSince = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'status'),
            SiteUptimeWindows::fromPayload(Fields::object($payload, 'windows')),
            array_map(SiteUptimeDay::fromPayload(...), Fields::objects($payload, 'days')),
            Fields::optionalInteger($payload, 'responseMs'),
            Fields::optionalString($payload, 'downSince'),
            Fields::optionalString($payload, 'monitoredSince'),
        );
    }
}
