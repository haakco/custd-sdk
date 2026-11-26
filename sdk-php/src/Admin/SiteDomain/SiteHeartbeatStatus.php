<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteHeartbeatStatus is where a scheduled job's latest expected report stands. */
enum SiteHeartbeatStatus: string
{
    case Pending = 'pending';
    case OnTime = 'on-time';
    case Late = 'late';
    case Missed = 'missed';
    case Failed = 'failed';
}
