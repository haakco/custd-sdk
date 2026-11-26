<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteHeartbeatOutcome is what the job reported for one scheduled run. */
final class SiteHeartbeatOutcome
{
    public const SUCCEEDED = 'succeeded';
    public const FAILED = 'failed';
}
