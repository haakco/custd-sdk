<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteCheckMode is how a verified domain is checked. Custd cannot tell that a
 * site is stopped, so whoever stops a site sets its domain to Paused; nothing
 * then requests it until the mode is set back.
 */
final class SiteCheckMode
{
    /** No requests at all: no uptime, certificate or warming check. */
    public const PAUSED = 'paused';
    /** The home page every five minutes and the certificate every six hours (the default). */
    public const UPTIME = 'uptime';
    /** Uptime, plus one anonymous home page GET every minute. */
    public const WARM = 'warm';
}
