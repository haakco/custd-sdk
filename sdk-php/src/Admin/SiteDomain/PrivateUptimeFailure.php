<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** PrivateUptimeFailure is the step a failed private uptime check stopped at. */
enum PrivateUptimeFailure: string
{
    case Dns = 'dns';
    case Connection = 'connection';
    case Tls = 'tls';
    case Timeout = 'timeout';
}
