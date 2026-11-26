<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** PrivateUptimeFailure is the step a failed private uptime check stopped at. */
final class PrivateUptimeFailure
{
    public const DNS = 'dns';
    public const CONNECTION = 'connection';
    public const TLS = 'tls';
    public const TIMEOUT = 'timeout';
}
