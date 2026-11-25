<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteStatusComponentStatus is the state a status page shows for one component. */
enum SiteStatusComponentStatus: string
{
    /** No recent check, or none yet. */
    case Unknown = 'unknown';
    case Up = 'up';
    /** One failed check, not yet an outage. */
    case Failing = 'failing';
    /** An open incident. */
    case Down = 'down';
    case Paused = 'paused';
    /** Inside a scheduled maintenance window. */
    case Maintenance = 'maintenance';
}
