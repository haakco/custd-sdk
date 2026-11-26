<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** PrivateUptimeStatus is what the last private uptime report said about the site. */
final class PrivateUptimeStatus
{
    public const UNKNOWN = 'unknown';
    public const UP = 'up';
    public const DOWN = 'down';
}
