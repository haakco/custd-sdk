<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteStatusComponentStatus is the state a status page shows for one component. */
final class SiteStatusComponentStatus
{
    /** No recent check, or none yet. */
    public const UNKNOWN = 'unknown';
    public const UP = 'up';
    /** One failed check, not yet an outage. */
    public const FAILING = 'failing';
    /** An open incident. */
    public const DOWN = 'down';
    public const PAUSED = 'paused';
    /** Inside a scheduled maintenance window. */
    public const MAINTENANCE = 'maintenance';
}
