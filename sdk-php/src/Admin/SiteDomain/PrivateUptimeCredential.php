<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** PrivateUptimeCredential is the monitor with the agent's report token, shown once, and its report path. */
final readonly class PrivateUptimeCredential
{
    public function __construct(
        public PrivateUptimeMonitor $monitor,
        public string $token,
        public string $reportPath,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            PrivateUptimeMonitor::fromPayload(Fields::object($payload, 'monitor')),
            Fields::string($payload, 'token'),
            Fields::string($payload, 'reportPath'),
        );
    }
}
