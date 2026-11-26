<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteGeneratedFixFormat names the values of SiteGeneratedFix.format.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteGeneratedFixFormat
{
    public const HTML = 'html';
    public const ROBOTS_TXT = 'robots.txt';
    public const REDIRECT = 'redirect';
}
