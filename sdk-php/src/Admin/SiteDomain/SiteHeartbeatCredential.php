<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteHeartbeatCredential is a monitor with its report token, shown once, and the path the job reports to. */
final readonly class SiteHeartbeatCredential
{
    public function __construct(
        public SiteHeartbeatMonitor $monitor,
        public string $token,
        public string $reportPath,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteHeartbeatMonitor::fromPayload(Fields::object($payload, 'monitor')),
            Fields::string($payload, 'token'),
            Fields::string($payload, 'reportPath'),
        );
    }
}
