<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteFindingSeverity names the values of Finding.severity, SiteNextAction.severity.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteFindingSeverity
{
    public const HIGH = 'high';
    public const MEDIUM = 'medium';
    public const LOW = 'low';
    public const INFO = 'info';
}
