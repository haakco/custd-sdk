<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteRobotsDirective is the kind of robots.txt rule that decided a test. */
final class SiteRobotsDirective
{
    public const ALLOW = 'allow';
    public const DISALLOW = 'disallow';
}
