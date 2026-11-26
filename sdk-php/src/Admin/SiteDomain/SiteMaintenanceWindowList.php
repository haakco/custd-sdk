<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteMaintenanceWindowList is a domain's maintenance windows. */
final readonly class SiteMaintenanceWindowList
{
    /** @param list<SiteMaintenanceWindow> $windows */
    public function __construct(public array $windows = [])
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(array_map(SiteMaintenanceWindow::fromPayload(...), Fields::objects($payload, 'windows')));
    }
}
