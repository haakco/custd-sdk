<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SitePageRecheckState is where a one-page recheck is: waiting for the scheduler, done, or failed. */
enum SitePageRecheckState: string
{
    case Queued = 'queued';
    case Checked = 'checked';
    case Failed = 'failed';
}
