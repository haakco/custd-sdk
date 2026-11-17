<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteRobotsDirective is the kind of robots.txt rule that decided a test. */
enum SiteRobotsDirective: string
{
    case Allow = 'allow';
    case Disallow = 'disallow';
}
