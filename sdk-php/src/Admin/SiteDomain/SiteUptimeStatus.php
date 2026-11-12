<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteUptimeStatus is the uptime state a domain shows. */
enum SiteUptimeStatus: string
{
    /** No check in the last fifteen minutes, or none yet. */
    case Unknown = 'unknown';
    case Up = 'up';
    /** One failed check, not yet an outage. */
    case Failing = 'failing';
    /** An open incident: two or more failed checks in a row. */
    case Down = 'down';
    case Paused = 'paused';
}
