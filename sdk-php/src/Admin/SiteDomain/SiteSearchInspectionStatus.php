<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteSearchInspectionStatus is where a URL Inspection is: waiting for the scheduler, answered, or failed. */
enum SiteSearchInspectionStatus: string
{
    case Queued = 'queued';
    case Done = 'done';
    case Failed = 'failed';
}
