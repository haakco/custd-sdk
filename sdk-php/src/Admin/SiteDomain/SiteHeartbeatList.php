<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteHeartbeatList is a domain's scheduled-job monitors. */
final readonly class SiteHeartbeatList
{
    /** @param list<SiteHeartbeatMonitor> $monitors */
    public function __construct(public array $monitors = [])
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(array_map(SiteHeartbeatMonitor::fromPayload(...), Fields::objects($payload, 'monitors')));
    }
}
