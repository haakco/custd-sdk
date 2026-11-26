<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteHeartbeatStatus is where a scheduled job's latest expected report stands. */
final class SiteHeartbeatStatus
{
    public const PENDING = 'pending';
    public const ON_TIME = 'on-time';
    public const LATE = 'late';
    public const MISSED = 'missed';
    public const FAILED = 'failed';
}
