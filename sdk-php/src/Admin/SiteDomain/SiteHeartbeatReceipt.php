<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteHeartbeatReceipt is the latest report a job sent and when it arrived. */
final readonly class SiteHeartbeatReceipt
{
    public function __construct(
        public SiteHeartbeatReport $report,
        public string $receivedAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteHeartbeatReport::fromPayload(Fields::object($payload, 'report')),
            Fields::string($payload, 'receivedAt'),
        );
    }
}
