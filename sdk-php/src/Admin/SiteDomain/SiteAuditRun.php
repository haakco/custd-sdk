<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteAuditRun names the values of SiteAuditDelta.run.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteAuditRun
{
    public const NOT_AUDITED = 'not_audited';
    public const FAILED = 'failed';
    public const TRUNCATED = 'truncated';
    public const COMPLETE = 'complete';
}
