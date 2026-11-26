<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteLighthouseProfile names the values of LighthousePageComparison.profile, LighthouseRun.profile,
 * SiteReportSpeed.profile.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteLighthouseProfile
{
    public const DESKTOP = 'desktop';
    public const MOBILE = 'mobile';
}
