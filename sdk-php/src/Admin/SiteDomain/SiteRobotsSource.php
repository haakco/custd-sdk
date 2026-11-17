<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteRobotsSource is which robots.txt a test read: the one the caller pasted, or the live file. */
enum SiteRobotsSource: string
{
    case Pasted = 'pasted';
    case Live = 'live';
}
