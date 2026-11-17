<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteUptimeWindows
{
    public function __construct(
        public SiteUptimeWindow $last24h,
        public SiteUptimeWindow $last7d,
        public SiteUptimeWindow $last30d,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteUptimeWindow::fromPayload(Fields::object($payload, 'last24h')),
            SiteUptimeWindow::fromPayload(Fields::object($payload, 'last7d')),
            SiteUptimeWindow::fromPayload(Fields::object($payload, 'last30d')),
        );
    }
}
