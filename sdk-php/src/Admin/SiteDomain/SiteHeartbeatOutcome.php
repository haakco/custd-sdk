<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteHeartbeatOutcome is what the job reported for one scheduled run. */
enum SiteHeartbeatOutcome: string
{
    case Succeeded = 'succeeded';
    case Failed = 'failed';
}
