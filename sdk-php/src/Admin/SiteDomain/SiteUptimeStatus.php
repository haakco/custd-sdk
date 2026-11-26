<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteUptimeStatus is the uptime state a domain shows. */
final class SiteUptimeStatus
{
    /** No check in the last fifteen minutes, or none yet. */
    public const UNKNOWN = 'unknown';
    public const UP = 'up';
    /** One failed check, not yet an outage. */
    public const FAILING = 'failing';
    /** An open incident: two or more failed checks in a row. */
    public const DOWN = 'down';
    public const PAUSED = 'paused';
}
