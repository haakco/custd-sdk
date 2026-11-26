<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SitePageRecheckState is where a one-page recheck is: waiting for the scheduler, done, or failed. */
final class SitePageRecheckState
{
    public const QUEUED = 'queued';
    public const CHECKED = 'checked';
    public const FAILED = 'failed';
}
