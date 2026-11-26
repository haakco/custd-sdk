<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * AccessLogHourStatus names the values of AccessLogHourReplay.previousStatus.
 * How the hour stood; missing when unrecorded.
 * A value Custd adds later still decodes as a plain string.
 */
final class AccessLogHourStatus
{
    public const DONE = 'done';
    public const PARTIAL = 'partial';
    public const FAILED = 'failed';
    public const MISSING = 'missing';
}
