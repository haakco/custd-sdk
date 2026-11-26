<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** PrivateUptimeStatus is what the last private uptime report said about the site. */
enum PrivateUptimeStatus: string
{
    case Unknown = 'unknown';
    case Up = 'up';
    case Down = 'down';
}
