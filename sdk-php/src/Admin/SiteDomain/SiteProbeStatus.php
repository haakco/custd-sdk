<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteProbeStatus names the values of SiteProbe.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteProbeStatus
{
    public const UNKNOWN = 'unknown';
    public const UP = 'up';
    public const DOWN = 'down';
    public const PAUSED = 'paused';
}
