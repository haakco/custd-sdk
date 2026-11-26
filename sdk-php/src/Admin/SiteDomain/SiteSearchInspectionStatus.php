<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteSearchInspectionStatus is where a URL Inspection is: waiting for the scheduler, answered, or failed. */
final class SiteSearchInspectionStatus
{
    public const QUEUED = 'queued';
    public const DONE = 'done';
    public const FAILED = 'failed';
}
